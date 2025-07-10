import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const barbeariaId = searchParams.get("barbeariaId")

    if (!barbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não fornecido" }, { status: 400 })
    }

    // Buscar assinatura da barbearia
    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId },
    })

    if (!assinatura) {
      return NextResponse.json({
        hasSubscription: false,
        status: "none",
        message: "Nenhuma assinatura encontrada",
      })
    }

    // Verificar se é trial e calcular dias restantes
    if (assinatura.plano === "trial") {
      const agora = new Date()
      const dataFim = assinatura.dataProximaCobranca
      const diasRestantes = Math.ceil((dataFim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

      if (diasRestantes <= 0) {
        // Trial expirado - atualizar status
        await prisma.assinatura.update({
          where: { barbeariaId },
          data: { status: "expired" },
        })

        return NextResponse.json({
          hasSubscription: true,
          status: "expired",
          plano: "trial",
          diasRestantes: 0,
          message: "⚠️ Período de teste expirado! Escolha um plano para continuar usando.",
          urgente: true,
        })
      }

      // Trial ativo
      const urgente = diasRestantes <= 2
      const message = urgente
        ? `🚨 Urgente! Apenas ${diasRestantes} ${diasRestantes === 1 ? "dia restante" : "dias restantes"} do seu teste grátis!`
        : `⏰ Período de teste: ${diasRestantes} ${diasRestantes === 1 ? "dia restante" : "dias restantes"}`

      return NextResponse.json({
        hasSubscription: true,
        status: "active",
        plano: "trial",
        diasRestantes,
        message,
        urgente,
      })
    }

    // Assinatura normal (mensal/anual)
    return NextResponse.json({
      hasSubscription: true,
      status: assinatura.status,
      plano: assinatura.plano,
      dataProximaCobranca: assinatura.dataProximaCobranca,
      message:
        assinatura.plano === "mensal" ? "✅ Plano Mensal Ativo (R$199,00/mês)" : "✅ Plano Anual Ativo (R$119,99/mês)",
    })
  } catch (error) {
    console.error("Erro ao verificar status da assinatura:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao verificar assinatura"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


