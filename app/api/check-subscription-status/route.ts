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

    if (!idToCheck) {
      return NextResponse.json({ error: "ID da barbearia não fornecido" }, { status: 400 })
    }

    // Buscar a assinatura da barbearia
    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: idToCheck },
    })

    if (!assinatura) {
      return NextResponse.json({
        hasSubscription: false,
        status: null,
        plan: null,
        message: "Nenhuma assinatura encontrada",
      })
    }

    // Verificar se o trial expirou
    const now = new Date()
    const isTrialExpired =
      assinatura.plano === "trial" && assinatura.dataProximaCobranca && assinatura.dataProximaCobranca < now

    if (isTrialExpired) {
      // Atualizar status para expirado
      await prisma.assinatura.update({
        where: { barbeariaId: idToCheck },
        data: { status: "expired" },
      })

      return NextResponse.json({
        hasSubscription: true,
        status: "expired",
        plan: "trial",
        message: "Período de teste expirado",
        expired: true,
      })
    }

    return NextResponse.json({
      hasSubscription: true,
      status: assinatura.status,
      plan: assinatura.plano,
      dataProximaCobranca: assinatura.dataProximaCobranca,
      ultimoPagamento: assinatura.ultimoPagamento,
    })
  } catch (error) {
    console.error("Erro ao verificar status da assinatura:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}






