import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barbeariaId = searchParams.get("barbeariaId")

    if (!barbeariaId || barbeariaId === "null") {
      return NextResponse.json({ error: "ID da barbearia não fornecido ou inválido" }, { status: 400 })
    }

    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      select: {
        id: true,
        nome: true,
        email: true,
        assinatura: {
          select: {
            id: true,
            status: true,
            plano: true,
            dataProximaCobranca: true,
            ultimoPagamento: true,
          },
        },
      },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    return NextResponse.json(barbearia)
  } catch (error) {
    console.error("Erro ao buscar barbearia:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar barbearia" },
      { status: 500 },
    )
  }
}

