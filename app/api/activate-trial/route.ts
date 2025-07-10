import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { barbeariaId } = await req.json()

    if (!barbeariaId) {
      return NextResponse.json({ error: "ID da barbearia não fornecido" }, { status: 400 })
    }

    // Verificar se a barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Verificar se já tem assinatura ativa
    const assinaturaExistente = await prisma.assinatura.findUnique({
      where: { barbeariaId },
    })

    if (assinaturaExistente?.status === "active") {
      return NextResponse.json({ error: "Barbearia já possui uma assinatura ativa" }, { status: 400 })
    }

    // Calcular datas do trial (7 dias)
    const dataInicio = new Date()
    const dataFim = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    const dataProximaCobranca = new Date(dataFim) // Cobrança após o trial

    // Criar ou atualizar assinatura com trial
    const assinatura = await prisma.assinatura.upsert({
      where: { barbeariaId },
      update: {
        status: "active",
        plano: "trial",
        dataInicio,
        dataProximaCobranca,
      },
      create: {
        barbeariaId,
        status: "active",
        plano: "trial",
        dataInicio,
        dataProximaCobranca,
      },
    })

    console.log("Trial ativado:", {
      barbeariaId,
      dataInicio,
      dataFim: dataProximaCobranca,
      status: assinatura.status,
    })

    return NextResponse.json({
      success: true,
      message: "Trial de 7 dias ativado com sucesso",
      assinatura,
    })
  } catch (error) {
    console.error("Erro ao ativar trial:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao ativar trial"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}



