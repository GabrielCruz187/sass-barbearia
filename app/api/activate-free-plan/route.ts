import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { barbeariaId } = await request.json()

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
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Verificar se já existe uma assinatura para esta barbearia
    const assinaturaExistente = await prisma.assinatura.findUnique({
      where: { barbeariaId },
    })

    if (assinaturaExistente && assinaturaExistente.status === "active") {
      return NextResponse.json({ error: "Barbearia já possui uma assinatura ativa" }, { status: 400 })
    }

    // Verificar se há vaga gratuita disponível (apenas 1 vaga)
    const assinaturasGratuitasAtivas = await prisma.assinatura.count({
      where: {
        status: "active",
        plano: "gratuito",
      },
    })

    if (assinaturasGratuitasAtivas >= 1) {
      return NextResponse.json(
        {
          error: "Não há mais vagas gratuitas disponíveis. Você pode iniciar um período de teste gratuito de 7 dias.",
        },
        { status: 400 },
      )
    }

    // Criar ou atualizar a assinatura gratuita
    const assinatura = await prisma.assinatura.upsert({
      where: { barbeariaId },
      update: {
        status: "active",
        plano: "gratuito",
        dataProximaCobranca: null,
        ultimoPagamento: new Date(),
      },
      create: {
        barbeariaId,
        status: "active",
        plano: "gratuito",
        dataProximaCobranca: null,
        ultimoPagamento: new Date(),
      },
    })

    console.log("Plano gratuito ativado:", assinatura)

    return NextResponse.json({
      success: true,
      message: "Parabéns! Sua barbearia foi ativada gratuitamente. Aproveite todas as funcionalidades!",
      assinatura,
    })
  } catch (error) {
    console.error("Erro ao ativar plano gratuito:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}




