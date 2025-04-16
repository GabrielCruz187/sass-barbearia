import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Obter prêmios da barbearia
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId

    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
      },
      orderBy: {
        chance: "desc",
      },
    })

    console.log("Prêmios encontrados:", premios.length)
    return NextResponse.json(premios)
  } catch (error) {
    console.error("Erro ao obter prêmios:", error)
    return NextResponse.json({ error: "Erro ao obter prêmios" }, { status: 500 })
  }
}

// Adicionar novo prêmio
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { titulo, descricao, chance, codigo } = await req.json()
    const barbeariaId = session.user.barbeariaId

    console.log("Adicionando prêmio via API:", { titulo, descricao, codigo, chance, barbeariaId })

    // Verificar se a soma das chances não ultrapassa 100%
    const premiosExistentes = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true, // Considerar apenas prêmios ativos
      },
      select: {
        chance: true,
      },
    })

    const somaChancesExistentes = premiosExistentes.reduce((soma, premio) => soma + premio.chance, 0)
    console.log("Soma das chances existentes:", somaChancesExistentes)
    console.log("Nova chance:", chance)
    console.log("Soma total:", somaChancesExistentes + chance)

    if (somaChancesExistentes + chance > 100) {
      return NextResponse.json(
        {
          error: `A soma das chances não pode ultrapassar 100%. Soma atual: ${somaChancesExistentes.toFixed(2)}%, disponível: ${(100 - somaChancesExistentes).toFixed(2)}%`,
        },
        { status: 400 },
      )
    }

    // Criar novo prêmio
    const novoPremio = await prisma.premio.create({
      data: {
        titulo,
        descricao,
        codigo,
        chance,
        barbeariaId,
      },
    })

    return NextResponse.json(novoPremio, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar prêmio:", error)
    return NextResponse.json({ error: "Erro ao adicionar prêmio" }, { status: 500 })
  }
}
