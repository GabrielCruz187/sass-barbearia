import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: Request) {
  try {
    const { barbeariaId, plan, forceUpdate } = await request.json()

    if (!barbeariaId) {
      return NextResponse.json({ error: "ID da barbearia é obrigatório" }, { status: 400 })
    }

    // Tentar obter a sessão, mas não exigir autenticação para barbearias recém-cadastradas
    let sessionBarbeariaId = null
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.barbeariaId) {
        sessionBarbeariaId = session.user.barbeariaId
      }
    } catch (error) {
      console.log("Sessão não disponível, continuando sem autenticação para barbearia:", barbeariaId)
    }

    // Se tiver sessão, verificar se o ID corresponde
    if (sessionBarbeariaId && barbeariaId !== sessionBarbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não corresponde à sessão" }, { status: 403 })
    }

    // Verificar se a barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: { assinatura: true },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Verificar se já tem assinatura ativa (exceto se for para forçar atualização)
    if (
      barbearia.assinatura &&
      barbearia.assinatura.status === "active" &&
      barbearia.assinatura.plano !== "trial" &&
      !forceUpdate
    ) {
      return NextResponse.json({ error: "Barbearia já possui uma assinatura ativa" }, { status: 400 })
    }

    // Definir preços baseados no plano
    let amount: number
    let priceId: string

    if (plan === "annual") {
      amount = 131880 // R$ 1.318,80 em centavos
      priceId = process.env.STRIPE_ANNUAL_PRICE_ID!
    } else {
      amount = 39800 // R$ 398,00 em centavos (taxa de adesão + primeira mensalidade)
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID!
    }

    // Criar PaymentIntent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "brl",
      metadata: {
        barbeariaId,
        plan,
        isSubscription: "true",
      },
      description: `Assinatura ${plan === "annual" ? "Anual" : "Mensal"} - ${barbearia.nome}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      plan,
    })
  } catch (error) {
    console.error("Erro ao criar assinatura:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}






