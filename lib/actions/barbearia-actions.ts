"use server"

import prisma from "@/lib/prisma"

export async function listarBarbearias() {
  try {
    console.log("Server Action: Iniciando busca de barbearias")

    const barbearias = await prisma.barbearia.findMany({
      select: {
        id: true,
        nome: true,
        endereco: true,
        logoUrl: true,
        slug: true,
      },
      orderBy: {
        nome: "asc",
      },
    })

    console.log("Server Action: Barbearias encontradas:", barbearias)

    return { success: true, data: barbearias }
  } catch (error) {
    console.error("Server Action: Erro ao listar barbearias:", error)
    return { success: false, error: "Erro ao listar barbearias" }
  }
}

export async function buscarBarbeariaPorSlug(slug: string) {
  try {
    console.log("Server Action: Buscando barbearia por slug:", slug)

    const barbearia = await prisma.barbearia.findUnique({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        nome: true,
        endereco: true,
        logoUrl: true,
        slug: true,
        corPrimaria: true,
        corSecundaria: true,
        mensagemMarketing: true,
      },
    })

    if (!barbearia) {
      return { success: false, error: "Barbearia não encontrada" }
    }

    console.log("Server Action: Barbearia encontrada:", barbearia)
    return { success: true, data: barbearia }
  } catch (error) {
    console.error("Server Action: Erro ao buscar barbearia:", error)
    return { success: false, error: "Erro ao buscar barbearia" }
  }
}

