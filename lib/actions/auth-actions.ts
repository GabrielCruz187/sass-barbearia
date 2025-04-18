"use server"

import { hash } from "bcrypt"
import prisma from "@/lib/prisma"

// Cadastrar nova barbearia
export async function cadastrarBarbearia(formData: FormData) {
  try {
    const nome = formData.get("nome") as string
    const email = formData.get("email") as string
    const telefone = formData.get("telefone") as string
    const whatsapp = (formData.get("whatsapp") as string) || telefone
    const senha = formData.get("senha") as string
    const endereco = (formData.get("endereco") as string) || ""

    // Verificar se o email já está em uso
    const barbeariaExistente = await prisma.barbearia.findUnique({
      where: {
        email,
      },
    })

    if (barbeariaExistente) {
      return { error: "Este email já está em uso por outra barbearia" }
    }

    // Hash da senha
    const senhaHash = await hash(senha, 10)

    // Criar nova barbearia
    const novaBarbearia = await prisma.barbearia.create({
      data: {
        nome,
        email,
        telefone,
        whatsapp,
        senha: senhaHash,
        endereco,
        // Usar cores em escala de cinza
        corPrimaria: "#333333",
        corSecundaria: "#666666",
        configuracoes: {
          create: {
            limiteJogosMes: 1,
            diasValidade: 30,
          },
        },
      },
    })

    // Não criar prêmios padrão - deixar o dono da barbearia adicionar os próprios prêmios

    // Em vez de redirecionar diretamente, retornamos sucesso
    return { success: true, redirectTo: "/login?cadastro=sucesso" }
  } catch (error) {
    console.error("Erro ao cadastrar barbearia:", error)
    return { error: "Erro ao cadastrar barbearia" }
  }
}

// Cadastrar novo cliente
export async function cadastrarCliente(formData: FormData) {
  try {
    const nome = formData.get("nome") as string
    const email = formData.get("email") as string
    const telefone = formData.get("telefone") as string
    const senha = formData.get("senha") as string
    const barbeariaId = formData.get("barbeariaId") as string

    console.log("Dados do cliente:", { nome, email, telefone, barbeariaId })

    // Verificar se a barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: {
        id: barbeariaId,
      },
    })

    if (!barbearia) {
      return { error: "Barbearia não encontrada. Por favor, selecione uma barbearia válida." }
    }

    // Verificar se o email já está em uso para esta barbearia
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        email,
        barbeariaId,
      },
    })

    if (usuarioExistente) {
      return { error: "Este email já está em uso" }
    }

    // Hash da senha
    const senhaHash = await hash(senha, 10)

    // Criar novo usuário
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        telefone,
        senha: senhaHash,
        role: "CLIENTE",
        barbeariaId,
      },
    })

    console.log("Cliente cadastrado com sucesso:", novoUsuario.id)

    // Em vez de redirecionar diretamente, retornamos sucesso
    return { success: true, redirectTo: "/login?cadastro=sucesso" }
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error)
    return { error: `Erro ao cadastrar cliente: ${error instanceof Error ? error.message : String(error)}` }
  }
}

