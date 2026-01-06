export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barbeariaId = searchParams.get("barbeariaId")

    // Tentar obter a sessão, mas não exigir autenticação
    let sessionBarbeariaId = null
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.barbeariaId) {
        sessionBarbeariaId = session.user.barbeariaId
      }
    } catch (error) {
      console.log("Sessão não disponível, continuando sem autenticação")
    }

    // Usar o ID fornecido ou o da sessão
    const idToCheck = barbeariaId || sessionBarbeariaId

    // Verificar quantas assinaturas gratuitas estão ativas
    const assinaturasGratuitasAtivas = await prisma.assinatura.count({
      where: {
        status: "active",
        plano: "gratuito",
      },
    })

    console.log("Assinaturas gratuitas ativas:", assinaturasGratuitasAtivas)

    // Se tiver um ID específico, verificar o status dessa barbearia
    if (idToCheck) {
      const assinaturaExistente = await prisma.assinatura.findUnique({
        where: { barbeariaId: idToCheck },
      })

      // Se já tem assinatura ativa
      if (assinaturaExistente && assinaturaExistente.status === "active") {
        return NextResponse.json({
          freeSlotAvailable: false,
          trialAvailable: false,
          hasActiveSubscription: true,
          currentPlan: assinaturaExistente.plano,
          message: "Barbearia já possui uma assinatura ativa.",
        })
      }

      // Se já teve trial antes
      const jaTeveTrialAntes =
        assinaturaExistente &&
        (assinaturaExistente.plano === "trial" ||
          (assinaturaExistente.status === "expired" && assinaturaExistente.dataProximaCobranca))

      if (jaTeveTrialAntes) {
        return NextResponse.json({
          freeSlotAvailable: false,
          trialAvailable: false,
          alreadyUsedTrial: true,
          message: "Esta barbearia já utilizou o período de teste. Escolha um plano pago para continuar.",
        })
      }
    }

    // Verificar se há vaga gratuita disponível (apenas 1 vaga)
    const freeSlotAvailable = assinaturasGratuitasAtivas < 1

    if (freeSlotAvailable) {
      return NextResponse.json({
        freeSlotAvailable: true,
        trialAvailable: false,
        message: "Você ganhou acesso gratuito! Esta é uma das primeiras barbearias a se cadastrar.",
      })
    }

    // Se não há vaga gratuita, oferecer trial
    return NextResponse.json({
      freeSlotAvailable: false,
      trialAvailable: true,
      message: "Teste grátis por 7 dias! Depois escolha seu plano.",
    })
  } catch (error) {
    console.error("Erro ao verificar vagas gratuitas:", error)
    return NextResponse.json(
      {
        freeSlotAvailable: false,
        trialAvailable: true,
        message: "Teste grátis por 7 dias! Depois escolha seu plano.",
      },
      { status: 200 },
    )
  }
}






