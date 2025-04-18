"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { addDays } from "date-fns"
import { revalidatePath } from "next/cache"

// Verificar se o usuário já tem um jogo ativo sem realizar um novo jogo
export async function verificarJogoAtivo() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { error: "Não autorizado" }
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
      include: {
        premio: true,
        barbearia: {
          select: {
            nome: true,
            whatsapp: true,
            mensagemMarketing: true,
            logoUrl: true,
          },
        },
      },
    })

    if (jogoNoMesAtual) {
      console.log("Usuário já jogou neste mês:", jogoNoMesAtual.id)
      return {
        jogoExistente: {
          id: jogoNoMesAtual.id,
          dataExpiracao: jogoNoMesAtual.dataExpiracao,
          premio: {
            titulo: jogoNoMesAtual.premio.titulo,
            descricao: jogoNoMesAtual.premio.descricao,
            codigo: jogoNoMesAtual.premio.codigo,
          },
          barbearia: {
            nome: jogoNoMesAtual.barbearia.nome,
            whatsapp: jogoNoMesAtual.barbearia.whatsapp,
            mensagemMarketing: jogoNoMesAtual.barbearia.mensagemMarketing,
            logoUrl: jogoNoMesAtual.barbearia.logoUrl,
          },
        },
      }
    }

    // Verificar se há prêmios disponíveis
    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true,
      },
    })

    if (premios.length === 0) {
      return { semPremios: true }
    }

    return { podeJogar: true }
  } catch (error) {
    console.error("Erro ao verificar jogo ativo:", error)
    return { error: "Erro ao verificar jogo ativo" }
  }
}

// Realizar um jogo/sorteio
export async function realizarJogo() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { error: "Não autorizado" }
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
      include: {
        premio: true,
        barbearia: {
          select: {
            nome: true,
            whatsapp: true,
            mensagemMarketing: true,
            logoUrl: true,
          },
        },
      },
    })

    if (jogoNoMesAtual) {
      console.log("Usuário já jogou neste mês:", jogoNoMesAtual.id)
      return {
        error: "Você já jogou neste mês",
        jogoExistente: {
          id: jogoNoMesAtual.id,
          dataExpiracao: jogoNoMesAtual.dataExpiracao,
          premio: {
            titulo: jogoNoMesAtual.premio.titulo,
            descricao: jogoNoMesAtual.premio.descricao,
            codigo: jogoNoMesAtual.premio.codigo,
          },
          barbearia: {
            nome: jogoNoMesAtual.barbearia.nome,
            whatsapp: jogoNoMesAtual.barbearia.whatsapp,
            mensagemMarketing: jogoNoMesAtual.barbearia.mensagemMarketing,
            logoUrl: jogoNoMesAtual.barbearia.logoUrl,
          },
        },
      }
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
      return { semPremios: true, error: "Não há prêmios disponíveis para esta barbearia" }
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
            logoUrl: true,
          },
        },
      },
    })

    revalidatePath("/cliente/jogo")

    return {
      success: true,
      jogo: {
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
          logoUrl: novoJogo.barbearia.logoUrl,
        },
        dataExpiracao: novoJogo.dataExpiracao,
      },
    }
  } catch (error) {
    console.error("Erro ao realizar jogo:", error)
    return { error: "Erro ao realizar jogo" }
  }
}

// Resgatar prêmio (para admin)
export async function resgatarPremio(jogoId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Não autorizado" }
    }

    const barbeariaId = session.user.barbeariaId

    // Verificar se o jogo pertence à barbearia
    const jogo = await prisma.jogo.findFirst({
      where: {
        id: jogoId,
        barbeariaId,
      },
    })

    if (!jogo) {
      return { error: "Jogo não encontrado" }
    }

    // Verificar se o prêmio já foi resgatado
    if (jogo.resgatado) {
      return { error: "Este prêmio já foi resgatado" }
    }

    // Verificar se o prêmio está expirado
    if (new Date() > jogo.dataExpiracao) {
      return { error: "Este prêmio está expirado" }
    }

    // Marcar como resgatado
    await prisma.jogo.update({
      where: {
        id: jogoId,
      },
      data: {
        resgatado: true,
        dataResgate: new Date(),
      },
    })

    revalidatePath("/admin/clientes")
    return { success: true }
  } catch (error) {
    console.error("Erro ao resgatar prêmio:", error)
    return { error: "Erro ao resgatar prêmio" }
  }
}
