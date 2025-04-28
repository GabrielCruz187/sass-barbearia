import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { barbeariaId } = await req.json()

    if (!barbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não fornecido" }, { status: 400 })
    }

    // Verificar se a barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Contar quantas barbearias já estão ativas
    const barbeariaCount = await prisma.barbearia.count({
      where: {
        assinatura: {
          status: "active",
        },
      },
    })

    // Verificar se ainda há vagas gratuitas disponíveis (limite de 2)
    if (barbeariaCount >= 2) {
      return NextResponse.json({ error: "Não há mais vagas gratuitas disponíveis" }, { status: 400 })
    }

    // Criar ou atualizar a assinatura como gratuita
    await prisma.assinatura.upsert({
      where: { barbeariaId },
      update: {
        status: "active",
        plano: "gratuito",
        dataInicio: new Date(),
        dataProximaCobranca: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano a partir de agora
      },
      create: {
        barbeariaId,
        status: "active",
        plano: "gratuito",
        dataInicio: new Date(),
        dataProximaCobranca: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano a partir de agora
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao ativar plano gratuito:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao ativar plano gratuito" },
      { status: 500 },
    )
  }
}
