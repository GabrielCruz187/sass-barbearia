import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"

// Obter configurações da barbearia
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId

    const barbearia = await prisma.barbearia.findUnique({
      where: {
        id: barbeariaId,
      },
      include: {
        configuracao: true,
      },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      nome: barbearia.nome,
      email: barbearia.email,
      telefone: barbearia.telefone,
      whatsapp: barbearia.whatsapp,
      endereco: barbearia.endereco,
      logoUrl: barbearia.logoUrl,
      mensagemMarketing: barbearia.mensagemMarketing,
      corPrimaria: barbearia.corPrimaria,
      corSecundaria: barbearia.corSecundaria,
      limiteJogosMes: barbearia.configuracao?.limiteJogosMes || 1,
      diasValidade: barbearia.configuracao?.diasValidade || 30,
    })
  } catch (error) {
    console.error("Erro ao obter configurações:", error)
    return NextResponse.json({ error: "Erro ao obter configurações" }, { status: 500 })
  }
}

// Atualizar configurações da barbearia
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId
    const formData = await req.formData()

    const nome = formData.get("nome") as string
    const telefone = formData.get("telefone") as string
    const whatsapp = formData.get("whatsapp") as string
    const endereco = formData.get("endereco") as string
    const mensagemMarketing = formData.get("mensagemMarketing") as string
    const corPrimaria = formData.get("corPrimaria") as string
    const corSecundaria = formData.get("corSecundaria") as string
    const limiteJogosMes = Number.parseInt(formData.get("limiteJogosMes") as string)
    const diasValidade = Number.parseInt(formData.get("diasValidade") as string)

    const logoFile = formData.get("logo") as File

    // Atualizar dados da barbearia
    const dadosAtualizacao: any = {
      nome,
      telefone,
      whatsapp,
      endereco,
      mensagemMarketing,
      corPrimaria,
      corSecundaria,
    }

    // Se enviou um novo logo, fazer upload
    if (logoFile && logoFile.size > 0) {
      const blob = await put(`logos/${barbeariaId}/${logoFile.name}`, logoFile, {
        access: "public",
      })

      dadosAtualizacao.logoUrl = blob.url
    }

    // Atualizar barbearia
    await prisma.barbearia.update({
      where: {
        id: barbeariaId,
      },
      data: dadosAtualizacao,
    })

    // Atualizar configurações
    await prisma.configuracao.upsert({
      where: {
        barbeariaId,
      },
      update: {
        limiteJogosMes,
        diasValidade,
      },
      create: {
        barbeariaId,
        limiteJogosMes,
        diasValidade,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 })
  }
}
