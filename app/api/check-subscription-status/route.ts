import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.barbeariaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar a assinatura da barbearia
    const assinatura = await prisma.assinatura.findUnique({
      where: { barbeariaId: session.user.barbeariaId },
    })

    if (!assinatura) {
      return NextResponse.json({ status: "inactive" })
    }

    return NextResponse.json({
      status: assinatura.status,
      plano: assinatura.plano,
      dataProximaCobranca: assinatura.dataProximaCobranca,
    })
  } catch (error) {
    console.error("Erro ao verificar status da assinatura:", error)
    return NextResponse.json({ error: "Erro ao verificar status da assinatura" }, { status: 500 })
  }
}
