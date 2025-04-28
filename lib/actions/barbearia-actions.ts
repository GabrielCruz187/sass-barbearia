"use server"

import prisma from "@/lib/prisma"

// Listar todas as barbearias disponíveis para cadastro de clientes
export async function listarBarbearias() {
  try {
    console.log("Server Action: Iniciando busca de barbearias")

    const barbearias = await prisma.barbearia.findMany({
      select: {
        id: true,
        nome: true,
        endereco: true,
        logoUrl: true,
      },
      orderBy: {
        nome: "asc",
      },
    })

    console.log("Server Action: Barbearias encontradas:", barbearias)

    return { success: true, data: barbearias }
  } catch (error) {
    console.error("Server Action: Erro ao listar barbearias:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

// Verificar conexão com o banco de dados
export async function verificarBancoDados() {
  try {
    console.log("Server Action: Verificando conexão com o banco de dados")

    // Testar conexão com o banco de dados
    await prisma.$queryRaw`SELECT 1`
    console.log("Server Action: Conexão com o banco de dados OK")

    // Contar barbearias
    const count = await prisma.barbearia.count()
    console.log(`Server Action: Total de barbearias: ${count}`)

    return {
      success: true,
      dbConnection: "OK",
      count,
    }
  } catch (error) {
    console.error("Server Action: Erro ao verificar banco de dados:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

// Criar uma barbearia de teste (para depuração)
export async function criarBarbeariaTeste() {
  try {
    console.log("Server Action: Criando barbearia de teste")

    // Verificar se já existe uma barbearia de teste
    const existente = await prisma.barbearia.findFirst({
      where: {
        email: "teste@barbearia.com",
      },
    })

    if (existente) {
      console.log("Server Action: Barbearia de teste já existe:", existente.id)
      return {
        success: true,
        message: "Barbearia de teste já existe",
        id: existente.id,
      }
    }

    // Criar barbearia de teste
    const barbearia = await prisma.barbearia.create({
      data: {
        nome: "Barbearia Teste",
        email: "teste@barbearia.com",
        telefone: "11999999999",
        whatsapp: "11999999999",
        senha: "$2b$10$X7tUdVrC0jY3xnCzEYCkD.RXCbm.hh4qYSNQz4hRFMNlAGZzXkh8e", // "teste123"
        endereco: "Rua de Teste, 123",
        corPrimaria: "#333333",
        corSecundaria: "#666666",
        configuracao: {
          create: {
            limiteJogosMes: 1,
            diasValidade: 30,
          },
        },
      },
    })

    console.log("Server Action: Barbearia de teste criada:", barbearia.id)

    return {
      success: true,
      message: "Barbearia de teste criada com sucesso",
      id: barbearia.id,
    }
  } catch (error) {
    console.error("Server Action: Erro ao criar barbearia de teste:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
