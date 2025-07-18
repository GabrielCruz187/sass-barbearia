import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generateUniqueSlug } from "@/lib/utils/slug-generator"
import { put } from "@vercel/blob"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.barbeariaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbearia = await prisma.barbearia.findUnique({
      where: {
        id: session.user.barbeariaId,
      },
      include: {
        configuracao: true,
      },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Se não tem slug, gerar um
    let slug = barbearia.slug
    if (!slug) {
      slug = await generateUniqueSlug(barbearia.nome, barbearia.id)
      await prisma.barbearia.update({
        where: { id: barbearia.id },
        data: { slug },
      })
    }

    return NextResponse.json({
      id: barbearia.id,
      nome: barbearia.nome,
      email: barbearia.email,
      telefone: barbearia.telefone,
      whatsapp: barbearia.whatsapp,
      endereco: barbearia.endereco,
      logoUrl: barbearia.logoUrl,
      slug: slug,
      corPrimaria: barbearia.corPrimaria || "#333333",
      corSecundaria: barbearia.corSecundaria || "#666666",
      mensagemMarketing: barbearia.mensagemMarketing || "",
      paginaPersonalizada: barbearia.paginaPersonalizada || false,
      limiteJogosMes: barbearia.configuracao?.limiteJogosMes || 1,
      diasValidade: barbearia.configuracao?.diasValidade || 30,
    })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.barbeariaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await req.formData()

    const nome = formData.get("nome") as string
    const telefone = formData.get("telefone") as string
    const whatsapp = formData.get("whatsapp") as string
    const endereco = formData.get("endereco") as string
    const corPrimaria = formData.get("corPrimaria") as string
    const corSecundaria = formData.get("corSecundaria") as string
    const mensagemMarketing = formData.get("mensagemMarketing") as string
    const limiteJogosMes = Number.parseInt(formData.get("limiteJogosMes") as string)
    const diasValidade = Number.parseInt(formData.get("diasValidade") as string)
    const logoFile = formData.get("logo") as File

    const updateData: any = {
      corPrimaria,
      corSecundaria,
      mensagemMarketing,
    }

    // Se foi enviado informações básicas, atualizar também
    if (nome) updateData.nome = nome
    if (telefone) updateData.telefone = telefone
    if (whatsapp) updateData.whatsapp = whatsapp
    if (endereco) updateData.endereco = endereco

    // Se foi enviado um novo logo, fazer upload
    if (logoFile && logoFile.size > 0) {
      try {
        const blob = await put(`logos/${session.user.barbeariaId}/${logoFile.name}`, logoFile, {
          access: "public",
        })
        updateData.logoUrl = blob.url
      } catch (uploadError) {
        console.error("Erro no upload do logo:", uploadError)
        return NextResponse.json({ error: "Erro ao fazer upload do logo" }, { status: 500 })
      }
    }

    // Atualizar barbearia
    await prisma.barbearia.update({
      where: {
        id: session.user.barbeariaId,
      },
      data: updateData,
    })

    // Atualizar ou criar configuração
    await prisma.configuracao.upsert({
      where: {
        barbeariaId: session.user.barbeariaId,
      },
      update: {
        limiteJogosMes,
        diasValidade,
      },
      create: {
        barbeariaId: session.user.barbeariaId,
        limiteJogosMes,
        diasValidade,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}


