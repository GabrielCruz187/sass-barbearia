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
    const modeTeste = formData.get("modeTeste") === "true"

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

    // Criar prêmios padrão
    await prisma.premio.createMany({
      data: [
        {
          titulo: "20% de desconto",
          descricao: "Desconto no corte + barba",
          codigo: "DESC20CB",
          chance: 40,
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "30% em produtos",
          descricao: "Desconto em produtos de barba",
          codigo: "DESC30PB",
          chance: 30,
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "20% em pomada",
          descricao: "Desconto em pomada",
          codigo: "DESC20POM",
          chance: 25,
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "Corte grátis",
          descricao: "Um corte de cabelo grátis",
          codigo: "CORTEGRATIS",
          chance: 5,
          barbeariaId: novaBarbearia.id,
        },
      ],
    })

    if (modeTeste) {
      // Se for modo teste, redireciona direto para o login
      return {
        success: true,
        barbeariaId: novaBarbearia.id,
        redirectTo: "/login?cadastro=sucesso",
      }
    } else {
      // Se não for modo teste, redireciona para o checkout
      return {
        success: true,
        barbeariaId: novaBarbearia.id,
        redirectTo: `/checkout?barbeariaId=${novaBarbearia.id}`,
      }
    }
  } catch (error) {
    console.error("Erro ao cadastrar barbearia:", error)
    return { error: "Erro ao cadastrar barbearia" }
  }
}

// Cadastrar cliente (mantido o código original)
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
      return { error: "Barbearia não encontrada" }
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

    return { success: true, redirectTo: "/login?cadastro=sucesso" }
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error)
    return { error: `Erro ao cadastrar usuário: ${error instanceof Error ? error.message : String(error)}` }
  }
}

