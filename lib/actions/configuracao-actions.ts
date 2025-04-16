"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"

// Atualizar configurações da barbearia
export async function atualizarConfiguracoes(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Não autorizado" }
    }

    const barbeariaId = session.user.barbeariaId

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

    revalidatePath("/admin/configuracoes")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return { error: "Erro ao atualizar configurações" }
  }
}
