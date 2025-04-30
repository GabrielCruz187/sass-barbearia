import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import prisma from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); 
  


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook Error: ${errorMessage}`)
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  // Manipular eventos específicos
  try {
    switch (event.type) {
      case "invoice.paid":
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Atualizar o status da assinatura para ativo
        await prisma.assinatura.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            status: "active",
            ultimoPagamento: new Date(),
            dataProximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
          },
        })
        break

      case "customer.subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription
        const customerIdCanceled = subscription.customer as string

        // Atualizar o status da assinatura para cancelado
        await prisma.assinatura.updateMany({
          where: { stripeCustomerId: customerIdCanceled },
          data: {
            status: "canceled",
          },
        })

        // Removido o código que atualizava o campo 'ativo' da barbearia
        break

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Erro ao processar webhook: ${error}`)
    return new Response(`Erro ao processar webhook: ${error}`, { status: 400 })
  }
}
