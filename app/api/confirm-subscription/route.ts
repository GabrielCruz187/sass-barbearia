import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/prisma"

// Inicializar o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(req: Request) {
  try {
    const { barbeariaId } = await req.json()

    if (!barbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não fornecido" }, { status: 400 })
    }

    // Verificar se a barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: { assinatura: true },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    if (!barbearia.assinatura) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
    }

    // Atualizar o status da assinatura
    await prisma.assinatura.update({
      where: { id: barbearia.assinatura.id },
      data: {
        status: "active",
        dataInicio: new Date(),
        dataProximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
      },
    })

    // Não atualizamos o campo 'ativo' da barbearia pois ele não existe no schema

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao confirmar assinatura:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao confirmar assinatura" },
      { status: 500 },
    )
  }
}
