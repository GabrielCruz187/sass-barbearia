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

    // Verificar se já existe uma assinatura ativa
    if (barbearia.assinatura?.status === "active") {
      return NextResponse.json({ error: "Barbearia já possui uma assinatura ativa" }, { status: 400 })
    }

    // Criar ou recuperar um cliente no Stripe
    let stripeCustomerId = barbearia.assinatura?.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: barbearia.email,
        name: barbearia.nome,
        metadata: {
          barbeariaId: barbearia.id,
        },
      })

      stripeCustomerId = customer.id
    }

    // Criar uma intenção de pagamento para a assinatura
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 4990, // R$49,90 em centavos
      currency: "brl",
      customer: stripeCustomerId,
      metadata: {
        barbeariaId: barbearia.id,
        type: "subscription_setup",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Atualizar ou criar o registro de assinatura
    await prisma.assinatura.upsert({
      where: { barbeariaId },
      update: {
        stripeCustomerId,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
      },
      create: {
        barbeariaId,
        stripeCustomerId,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
        plano: "premium",
        dataInicio: new Date(),
        dataProximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Erro ao criar assinatura:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar assinatura" },
      { status: 500 },
    )
  }
}
