import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    console.log("API check-free-slots: Verificando vagas gratuitas disponíveis")

    // Contar quantas barbearias já estão com assinatura ativa e plano gratuito
    const assinaturasGratuitasAtivas = await prisma.assinatura.count({
      where: {
        status: "active",
        plano: "gratuito",
      },
    })

    console.log("API check-free-slots: Assinaturas gratuitas ativas encontradas:", assinaturasGratuitasAtivas)

    // Verificar se ainda há vagas gratuitas disponíveis (limite de 2)
    const freeSlotAvailable = assinaturasGratuitasAtivas < 2

    console.log("API check-free-slots: Vagas gratuitas disponíveis:", freeSlotAvailable)

    return NextResponse.json({ freeSlotAvailable })
  } catch (error) {
    console.error("Erro ao verificar vagas gratuitas:", error)
    return NextResponse.json({ error: "Erro ao verificar vagas gratuitas" }, { status: 500 })
  }
}
