import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Contar quantas barbearias já estão com assinatura gratuita ativa (não trial)
    const freeSubscriptions = await prisma.assinatura.count({
      where: {
        status: "active",
        plano: "gratuito",
      },
    })

    console.log("Assinaturas gratuitas ativas:", freeSubscriptions)

    // As duas primeiras barbearias ganham acesso totalmente gratuito
    const freeSlotAvailable = freeSubscriptions < 2

    let message = ""
    if (freeSlotAvailable) {
      const remaining = 2 - freeSubscriptions
      message = `Você é uma das ${remaining === 2 ? "duas primeiras" : "últimas"} barbearias! Ganhe acesso gratuito para sempre!`
    } else {
      message = "Teste grátis por 7 dias! Depois escolha seu plano."
    }

    return NextResponse.json({
      freeSlotAvailable,
      message,
      trialAvailable: !freeSlotAvailable, // Se não tem vaga gratuita, tem trial
    })
  } catch (error) {
    console.error("Erro ao verificar vagas gratuitas:", error)
    return NextResponse.json(
      {
        freeSlotAvailable: false,
        trialAvailable: true,
        message: "Teste grátis por 7 dias! Depois escolha seu plano.",
      },
      { status: 500 },
    )
  }
}

