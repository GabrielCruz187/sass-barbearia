import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Contar quantas barbearias já estão com assinatura ativa
    const assinaturasAtivas = await prisma.assinatura.count({
      where: {
        status: "active",
      },
    })

    // Verificar se ainda há vagas gratuitas disponíveis (limite de 2)
    const freeSlotAvailable = assinaturasAtivas < 2

    return NextResponse.json({ freeSlotAvailable })
  } catch (error) {
    console.error("Erro ao verificar vagas gratuitas:", error)
    return NextResponse.json({ error: "Erro ao verificar vagas gratuitas" }, { status: 500 })
  }
}
