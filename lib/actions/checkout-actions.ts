"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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

    console.log("Verificando assinatura para barbeariaId:", session.user.barbeariaId)

    // Forçar revalidação do cache para garantir dados atualizados
    revalidatePath("/admin/assinatura")

    // Buscar a assinatura diretamente do banco de dados
    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: session.user.barbeariaId },
    })

    if (!assinatura) {
      console.log("Nenhuma assinatura encontrada para barbeariaId:", session.user.barbeariaId)
      return {
        status: "inactive",
        message: "Nenhuma assinatura encontrada",
        barbeariaId: session.user.barbeariaId,
      }
    }

    console.log("Assinatura encontrada:", JSON.stringify(assinatura, null, 2))

    return {
      status: assinatura.status,
      plano: assinatura.plano,
      dataProximaCobranca: assinatura.dataProximaCobranca,
      ultimoPagamento: assinatura.ultimoPagamento,
      barbeariaId: session.user.barbeariaId,
    }
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error)
    return { error: "Erro ao verificar status da assinatura" }
  }
}

// Função para verificar vagas gratuitas disponíveis
export async function verificarVagasGratuitas() {
  try {
    // Contar quantas barbearias já estão com assinatura ativa e plano gratuito
    const assinaturasGratuitasAtivas = await prisma.assinatura.count({
      where: {
        status: "active",
        plano: "gratuito",
      },
    })

    // Verificar se ainda há vagas gratuitas disponíveis (limite de 1)
    const vagasDisponiveis = Math.max(0, 1 - assinaturasGratuitasAtivas)

    return {
      success: true,
      vagasDisponiveis,
      limiteAtingido: vagasDisponiveis === 0,
    }
  } catch (error) {
    console.error("Erro ao verificar vagas gratuitas:", error)
    return { error: "Erro ao verificar vagas gratuitas disponíveis" }
  }
}

// Função para cancelar assinatura
export async function cancelarAssinatura() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.barbeariaId) {
      return { error: "Usuário não autenticado ou não é proprietário de barbearia" }
    }

    console.log("Cancelando assinatura para barbeariaId:", session.user.barbeariaId)

    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: session.user.barbeariaId },
    })

    if (!assinatura) {
      return { error: "Nenhuma assinatura encontrada" }
    }

    console.log("Assinatura encontrada para cancelamento:", assinatura)

    // Se for plano gratuito ou trial, apenas cancelar
    if (assinatura.plano === "gratuito" || assinatura.plano === "trial") {
      await prisma.assinatura.update({
        where: { id: assinatura.id },
        data: {
          status: "canceled",
        },
      })

      console.log("Assinatura gratuita/trial cancelada")
      revalidatePath("/admin/assinatura")
      return { success: true, message: "Assinatura cancelada com sucesso" }
    }

    // Para assinaturas pagas, cancelar no Stripe se houver stripeSubscriptionId
    if (assinatura.stripeSubscriptionId) {
      try {
        // Aqui você chamaria a API do Stripe para cancelar a assinatura
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
        // await stripe.subscriptions.cancel(assinatura.stripeSubscriptionId);
        console.log("Cancelamento no Stripe seria chamado aqui para:", assinatura.stripeSubscriptionId)
      } catch (stripeError) {
        console.error("Erro ao cancelar no Stripe:", stripeError)
        // Continuar com o cancelamento local mesmo se o Stripe falhar
      }
    }

    // Atualizar o status da assinatura no banco de dados
    const assinaturaAtualizada = await prisma.assinatura.update({
      where: { id: assinatura.id },
      data: {
        status: "canceled",
      },
    })

    console.log("Assinatura cancelada no banco:", assinaturaAtualizada)

    // Revalidar o caminho para garantir que os dados sejam atualizados
    revalidatePath("/admin/assinatura")

    return { success: true, message: "Assinatura cancelada com sucesso" }
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error)
    return { error: "Erro ao cancelar assinatura. Tente novamente." }
  }
}

// Função para forçar a atualização do status da assinatura
export async function forcarAtualizacaoAssinatura() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.barbeariaId) {
      return { error: "Usuário não autenticado ou não é proprietário de barbearia" }
    }

    // Buscar a assinatura diretamente do banco de dados
    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: session.user.barbeariaId },
    })

    if (!assinatura) {
      return { error: "Nenhuma assinatura encontrada" }
    }

    // Forçar a atualização do status para "active" se houver um pagamento registrado
    if (assinatura.ultimoPagamento && assinatura.status !== "active") {
      const assinaturaAtualizada = await prisma.assinatura.update({
        where: { id: assinatura.id },
        data: {
          status: "active",
        },
      })

      console.log("Assinatura forçada para ativa:", assinaturaAtualizada)

      // Revalidar o caminho para garantir que os dados sejam atualizados
      revalidatePath("/admin/assinatura")

      return {
        success: true,
        message: "Status da assinatura atualizado com sucesso",
        assinatura: assinaturaAtualizada,
      }
    }

    return {
      success: true,
      message: "Assinatura já está com o status correto",
      assinatura,
    }
  } catch (error) {
    console.error("Erro ao forçar atualização da assinatura:", error)
    return { error: "Erro ao atualizar status da assinatura" }
  }
}


