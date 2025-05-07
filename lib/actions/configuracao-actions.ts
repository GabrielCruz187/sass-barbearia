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

    console.log(
      "Logo recebido no server action:",
      logoFile ? { name: logoFile.name, size: logoFile.size, type: logoFile.type } : "Nenhum arquivo",
    )

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
      try {
        console.log("Iniciando upload do logo para Vercel Blob")
        const blob = await put(`logos/${barbeariaId}/${logoFile.name}`, logoFile, {
          access: "public",
        })
        console.log("Upload concluído com sucesso:", blob.url)
        dadosAtualizacao.logoUrl = blob.url
      } catch (uploadError) {
        console.error("Erro no upload do logo:", uploadError)
        return { error: "Erro ao fazer upload do logo" }
      }
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
