import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Inicializar o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(req: Request) {
  try {
    const { barbeariaId, plan, forceUpdate } = await req.json()

    // Obter a sessão diretamente usando getServerSession em vez de fazer fetch
    const session = await getServerSession(authOptions)
    const sessionBarbeariaId = session?.user?.barbeariaId

    if (!barbeariaId && !sessionBarbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não fornecido" }, { status: 400 })
    }

    // Usar o ID da sessão se disponível, caso contrário usar o ID fornecido
    const finalBarbeariaId = sessionBarbeariaId || barbeariaId

    // Verificar se a barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: finalBarbeariaId },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Verificar se já existe uma assinatura ativa
    const assinaturaExistente = await prisma.assinatura.findUnique({
      where: { barbeariaId: finalBarbeariaId },
    })

    // Se já existe uma assinatura ativa e não estamos forçando uma atualização, retornar erro
    if (assinaturaExistente?.status === "active" && !forceUpdate) {
      return NextResponse.json({ error: "Barbearia já possui uma assinatura ativa" }, { status: 400 })
    }

    // Valores atualizados: Mensal R$199,00 e Anual R$119,99/mês (R$1.439,88/ano)
    const amount = plan === "monthly" ? 19900 : 143988 // R$199,00 ou R$1.439,88 em centavos
    const planName = plan === "monthly" ? "mensal" : "anual"

    // Criar ou recuperar um cliente no Stripe
    let stripeCustomerId = assinaturaExistente?.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: barbearia.email,
        name: barbearia.nome,
        metadata: {
          barbeariaId: finalBarbeariaId,
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
        barbeariaId: finalBarbeariaId,
        type: forceUpdate ? "subscription_update" : "subscription_setup",
        plan: planName,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log("PaymentIntent criado:", {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ? "Disponível" : "Não disponível",
      status: paymentIntent.status,
      amount: amount,
      plan: planName,
    })

    // Atualizar ou criar o registro de assinatura
    const assinatura = await prisma.assinatura.upsert({
      where: { barbeariaId: finalBarbeariaId },
      update: {
        stripeCustomerId,
        stripePaymentIntentId: paymentIntent.id,
        status: forceUpdate ? "pending_update" : "pending",
        plano: planName,
      },
      create: {
        barbeariaId: finalBarbeariaId,
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

    console.log("Assinatura criada/atualizada:", assinatura)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Erro ao criar assinatura:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar assinatura"
    console.error("Detalhes do erro:", errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


