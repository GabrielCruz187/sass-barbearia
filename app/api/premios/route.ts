import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId

    if (!barbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não encontrado na sessão" }, { status: 400 })
    }

    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(premios)
  } catch (error) {
    console.error("Erro ao buscar prêmios:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar prêmios" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId

    if (!barbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não encontrado na sessão" }, { status: 400 })
    }

    const data = await request.json()

    // Validar dados
    if (!data.titulo || !data.descricao) {
      return NextResponse.json({ error: "Título e descrição são obrigatórios" }, { status: 400 })
    }

    // Criar o prêmio
    const premio = await prisma.premio.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        codigo: data.codigo || "",
        chance: data.chance || 10,
        ativo: data.ativo !== undefined ? data.ativo : true,
        barbeariaId,
      },
    })

    return NextResponse.json(premio)
  } catch (error) {
    console.error("Erro ao criar prêmio:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar prêmio" },
      { status: 500 },
    )
  }
}
