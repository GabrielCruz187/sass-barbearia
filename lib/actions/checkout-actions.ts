"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Função para obter informações da barbearia para o checkout
export async function getBarbeariaInfo(barbeariaId: string) {
  try {
    if (!barbeariaId) {
      return { error: "ID da barbearia não fornecido" }
    }

    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      select: {
        id: true,
        nome: true,
        email: true,
        assinatura: {
          select: {
            status: true,
            plano: true,
            dataProximaCobranca: true,
          },
        },
      },
    })

    if (!barbearia) {
      return { error: "Barbearia não encontrada" }
    }

    return {
      success: true,
      data: {
        id: barbearia.id,
        nome: barbearia.nome,
        email: barbearia.email,
        assinatura: barbearia.assinatura,
      },
    }
  } catch (error) {
    console.error("Erro ao buscar informações da barbearia:", error)
    return { error: "Erro ao buscar informações da barbearia" }
  }
}

// Função para verificar o status da assinatura
export async function verificarAssinatura() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.barbeariaId) {
      return { error: "Usuário não autenticado ou não é proprietário de barbearia" }
    }

    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: session.user.barbeariaId },
    })

    if (!assinatura) {
      return {
        status: "inactive",
        message: "Nenhuma assinatura encontrada",
      }
    }

    return {
      status: assinatura.status,
      plano: assinatura.plano,
      dataProximaCobranca: assinatura.dataProximaCobranca,
    }
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error)
    return { error: "Erro ao verificar status da assinatura" }
  }
}

// Função para cancelar assinatura
export async function cancelarAssinatura() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.barbeariaId) {
      return { error: "Usuário não autenticado ou não é proprietário de barbearia" }
    }

    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: session.user.barbeariaId },
    })

    if (!assinatura) {
      return { error: "Nenhuma assinatura encontrada" }
    }

    if (!assinatura.stripeSubscriptionId) {
      return { error: "Nenhuma assinatura ativa encontrada" }
    }

    // Aqui você chamaria a API do Stripe para cancelar a assinatura
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
    // await stripe.subscriptions.cancel(assinatura.stripeSubscriptionId);

    // Atualizar o status da assinatura no banco de dados
    await prisma.assinatura.update({
      where: { id: assinatura.id },
      data: {
        status: "canceled",
      },
    })

    return { success: true, message: "Assinatura cancelada com sucesso" }
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error)
    return { error: "Erro ao cancelar assinatura" }
  }
}

