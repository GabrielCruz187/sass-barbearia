import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    console.log("API activate-free-plan: Iniciando processamento")
    const { barbeariaId } = await req.json()

    if (!barbeariaId) {
      console.log("API activate-free-plan: ID da barbearia não fornecido")
      return NextResponse.json({ error: "ID da barbearia não fornecido" }, { status: 400 })
    }

    console.log("API activate-free-plan: Verificando barbearia", barbeariaId)

    // Verificar se a barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: {
        assinatura: true,
      },
    })

    if (!barbearia) {
      console.log("API activate-free-plan: Barbearia não encontrada")
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Verificar se a barbearia já tem uma assinatura ativa
    if (barbearia.assinatura && barbearia.assinatura.status === "active") {
      console.log("API activate-free-plan: Barbearia já possui assinatura ativa")
      return NextResponse.json({ error: "Barbearia já possui uma assinatura ativa" }, { status: 400 })
    }

    // Contar quantas barbearias já estão ativas com plano gratuito
    const barbeariaCount = await prisma.assinatura.count({
      where: {
        status: "active",
        plano: "gratuito",
      },
    })

    console.log("API activate-free-plan: Contagem de barbearias com plano gratuito ativo:", barbeariaCount)

    // Verificar se ainda há vagas gratuitas disponíveis (limite de 2)
    if (barbeariaCount >= 2) {
      console.log("API activate-free-plan: Não há mais vagas gratuitas disponíveis")
      return NextResponse.json({ error: "Não há mais vagas gratuitas disponíveis" }, { status: 400 })
    }

    // Criar ou atualizar a assinatura como gratuita
    const assinatura = await prisma.assinatura.upsert({
      where: { barbeariaId },
      update: {
        status: "active",
        plano: "gratuito",
        dataInicio: new Date(),
        dataProximaCobranca: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano a partir de agora
      },
      create: {
        barbeariaId,
        status: "active",
        plano: "gratuito",
        dataInicio: new Date(),
        dataProximaCobranca: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano a partir de agora
      },
    })

    console.log("API activate-free-plan: Assinatura ativada com sucesso", assinatura)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao ativar plano gratuito:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao ativar plano gratuito" },
      { status: 500 },
    )
  }
}
