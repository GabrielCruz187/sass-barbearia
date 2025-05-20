import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Inicializar o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(req: Request) {
  try {
    const { barbeariaId, plan } = await req.json()

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

    // Calcular a próxima data de cobrança com base no plano
    const dataProximaCobranca =
      plan === "monthly"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias para mensal
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 365 dias para anual

    // Atualizar o status da assinatura
    const assinaturaAtualizada = await prisma.assinatura.update({
      where: { id: barbearia.assinatura.id },
      data: {
        status: "active",
        plano: plan === "monthly" ? "mensal" : "anual",
        dataInicio: new Date(),
        dataProximaCobranca,
        ultimoPagamento: new Date(),
      },
    })

    console.log("Assinatura atualizada com sucesso:", assinaturaAtualizada)

    // Revalidar o caminho para garantir que os dados sejam atualizados
    revalidatePath("/admin/assinatura")

    return NextResponse.json({ success: true, assinatura: assinaturaAtualizada })
  } catch (error) {
    console.error("Erro ao confirmar assinatura:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao confirmar assinatura" },
      { status: 500 },
    )
  }
}
