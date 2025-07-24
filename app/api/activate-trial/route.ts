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

    // Verificar se já teve trial antes
    const jaTeveTrialAntes =
      assinaturaExistente &&
      (assinaturaExistente.plano === "trial" ||
        (assinaturaExistente.status === "expired" && assinaturaExistente.dataProximaCobranca))

    if (jaTeveTrialAntes) {
      return NextResponse.json(
        {
          error: "Esta barbearia já utilizou o período de teste. Escolha um plano pago para continuar.",
        },
        { status: 400 },
      )
    }

    // Verificar se deveria usar plano gratuito ao invés de trial
    const assinaturasGratuitasAtivas = await prisma.assinatura.count({
      where: {
        status: "active",
        plano: "gratuito",
      },
    })

    if (assinaturasGratuitasAtivas < 1) {
      return NextResponse.json(
        {
          error: "Você pode ativar o plano gratuito ao invés do trial!",
        },
        { status: 400 },
      )
    }

    // Calcular data de expiração do trial (7 dias)
    const dataExpiracao = new Date()
    dataExpiracao.setDate(dataExpiracao.getDate() + 7)

    // Criar ou atualizar a assinatura trial
    const assinatura = await prisma.assinatura.upsert({
      where: { barbeariaId },
      update: {
        status: "active",
        plano: "trial",
        dataProximaCobranca: dataExpiracao,
        ultimoPagamento: new Date(),
      },
      create: {
        barbeariaId,
        status: "active",
        plano: "trial",
        dataProximaCobranca: dataExpiracao,
        ultimoPagamento: new Date(),
      },
    })

    console.log("Trial ativado:", assinatura)

    return NextResponse.json({
      success: true,
      message: "Período de teste ativado com sucesso! Você tem 7 dias para testar todas as funcionalidades.",
      assinatura,
      dataExpiracao,
    })
  } catch (error) {
    console.error("Erro ao ativar trial:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}








