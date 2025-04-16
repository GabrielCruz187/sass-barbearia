import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Atualizar prêmio
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { titulo, descricao, chance, codigo, ativo } = await req.json()
    const barbeariaId = session.user.barbeariaId
    const premioId = params.id

    // Verificar se o prêmio pertence à barbearia
    const premio = await prisma.premio.findFirst({
      where: {
        id: premioId,
        barbeariaId,
      },
    })

    if (!premio) {
      return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 })
    }

    // Verificar se a soma das chances não ultrapassa 100%
    const premiosExistentes = await prisma.premio.findMany({
      where: {
        barbeariaId,
        id: {
          not: premioId,
        },
      },
      select: {
        chance: true,
      },
    })

    const somaChancesExistentes = premiosExistentes.reduce((soma, p) => soma + p.chance, 0)

    if (somaChancesExistentes + chance > 100) {
      return NextResponse.json({ error: "A soma das chances não pode ultrapassar 100%" }, { status: 400 })
    }

    // Atualizar prêmio
    const premioAtualizado = await prisma.premio.update({
      where: {
        id: premioId,
      },
      data: {
        titulo,
        descricao,
        codigo,
        chance,
        ativo,
      },
    })

    return NextResponse.json(premioAtualizado)
  } catch (error) {
    console.error("Erro ao atualizar prêmio:", error)
    return NextResponse.json({ error: "Erro ao atualizar prêmio" }, { status: 500 })
  }
}

// Excluir prêmio
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId
    const premioId = params.id

    // Verificar se o prêmio pertence à barbearia
    const premio = await prisma.premio.findFirst({
      where: {
        id: premioId,
        barbeariaId,
      },
    })

    if (!premio) {
      return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 })
    }

    // Excluir prêmio
    await prisma.premio.delete({
      where: {
        id: premioId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir prêmio:", error)
    return NextResponse.json({ error: "Erro ao excluir prêmio" }, { status: 500 })
  }
}
