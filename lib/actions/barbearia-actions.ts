"use server"

import prisma from "@/lib/prisma"

export async function verificarBancoDados() {
  try {
    console.log("Server Action: Verificando conexão com o banco de dados")

    // Tenta fazer uma operação simples no banco
    const count = await prisma.barbearia.count()

    return {
      success: true,
      message: "Conexão com banco de dados OK",
      barbeariaCount: count,
    }
  } catch (error) {
    console.error("Server Action: Erro ao verificar banco de dados:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao verificar banco de dados",
    }
  }
}

export async function criarBarbeariaTeste() {
  try {
    console.log("Server Action: Criando barbearia de teste")

    const testName = `Barbearia Teste ${Date.now()}`
    const testSlug = `teste-${Date.now()}`

    const barbearia = await prisma.barbearia.create({
      data: {
        nome: testName,
        slug: testSlug,
        endereco: "Rua Teste, 123",
        telefone: "(11) 99999-9999",
        email: "teste@barbearia.com",
        senha: "teste123", // Em produção, isso deveria ser hasheado
        corPrimaria: "#000000",
        corSecundaria: "#FFFFFF",
      },
    })

    console.log("Server Action: Barbearia de teste criada:", barbearia)
    return {
      success: true,
      message: "Barbearia de teste criada com sucesso",
      data: barbearia,
    }
  } catch (error) {
    console.error("Server Action: Erro ao criar barbearia de teste:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao criar barbearia de teste",
    }
  }
}

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
