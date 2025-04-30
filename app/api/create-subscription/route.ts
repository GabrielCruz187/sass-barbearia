import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/prisma"

// Inicializar o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


export async function POST(req: Request) {
  try {
    const { barbeariaId, plan } = await req.json()

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

    // Verificar se já existe uma assinatura ativa
    const assinaturaExistente = await prisma.assinatura.findUnique({
      where: { barbeariaId },
    })

    if (assinaturaExistente?.status === "active") {
      return NextResponse.json({ error: "Barbearia já possui uma assinatura ativa" }, { status: 400 })
    }

    // Definir o valor com base no plano
    const amount = plan === "monthly" ? 19900 : 180000 // R$199,00 ou R$1.800,00 em centavos
    const planName = plan === "monthly" ? "mensal" : "anual"

    // Criar ou recuperar um cliente no Stripe
    let stripeCustomerId = assinaturaExistente?.stripeCustomerId

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
      amount,
      currency: "brl",
      customer: stripeCustomerId,
      metadata: {
        barbeariaId: barbearia.id,
        type: "subscription_setup",
        plan: planName,
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
        plano: planName,
      },
      create: {
        barbeariaId,
        stripeCustomerId,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
        plano: planName,
        dataInicio: new Date(),
        dataProximaCobranca:
          plan === "monthly"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias para mensal
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 dias para anual
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
