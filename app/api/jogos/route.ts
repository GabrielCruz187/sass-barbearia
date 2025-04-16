import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { addDays } from "date-fns"

// Realizar um jogo/sorteio
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const usuarioId = session.user.id
    const barbeariaId = session.user.barbeariaId

    // Verificar se o usuário já jogou no mês atual
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    primeiroDiaMes.setHours(0, 0, 0, 0)

    const jogoNoMesAtual = await prisma.jogo.findFirst({
      where: {
        usuarioId,
        barbeariaId,
        createdAt: {
          gte: primeiroDiaMes,
        },
      },
    })

    if (jogoNoMesAtual) {
      return NextResponse.json({ error: "Você já jogou neste mês" }, { status: 400 })
    }

    // Obter configurações da barbearia
    const configuracao = await prisma.configuracao.findUnique({
      where: {
        barbeariaId,
      },
    })

    const diasValidade = configuracao?.diasValidade || 30

    // Obter prêmios ativos da barbearia
    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true,
      },
    })

    if (premios.length === 0) {
      return NextResponse.json({ error: "Não há prêmios disponíveis" }, { status: 400 })
    }

    // Realizar sorteio baseado nas chances
    const random = Math.random() * 100
    let cumulativeChance = 0
    let premioSorteado = null

    for (const premio of premios) {
      cumulativeChance += premio.chance
      if (random <= cumulativeChance) {
        premioSorteado = premio
        break
      }
    }

    // Se por algum motivo não sorteou nenhum prêmio, pega o primeiro
    if (!premioSorteado) {
      premioSorteado = premios[0]
    }

    // Registrar o jogo
    const dataExpiracao = addDays(new Date(), diasValidade)

    const novoJogo = await prisma.jogo.create({
      data: {
        usuarioId,
        premioId: premioSorteado.id,
        barbeariaId,
        dataExpiracao,
      },
      include: {
        premio: true,
        barbearia: {
          select: {
            nome: true,
            whatsapp: true,
            mensagemMarketing: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: novoJogo.id,
      premio: {
        titulo: novoJogo.premio.titulo,
        descricao: novoJogo.premio.descricao,
        codigo: novoJogo.premio.codigo,
      },
      barbearia: {
        nome: novoJogo.barbearia.nome,
        whatsapp: novoJogo.barbearia.whatsapp,
        mensagemMarketing: novoJogo.barbearia.mensagemMarketing,
      },
      dataExpiracao: novoJogo.dataExpiracao,
    })
  } catch (error) {
    console.error("Erro ao realizar jogo:", error)
    return NextResponse.json({ error: "Erro ao realizar jogo" }, { status: 500 })
  }
}

// Obter histórico de jogos (para admin)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId

    const jogos = await prisma.jogo.findMany({
      where: {
        barbeariaId,
      },
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
            telefone: true,
          },
        },
        premio: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(jogos)
  } catch (error) {
    console.error("Erro ao obter histórico de jogos:", error)
    return NextResponse.json({ error: "Erro ao obter histórico de jogos" }, { status: 500 })
  }
}
