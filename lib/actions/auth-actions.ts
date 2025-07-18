"use server"

import { hash } from "bcrypt"
import prisma from "@/lib/prisma"
import { isEmailValid } from "@/lib/email-validator"

// Função para gerar slug a partir do nome
function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .trim()
}

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

    // Verificar se o email é válido
    const emailValido = await isEmailValid(email)
    if (!emailValido) {
      return { error: "O email fornecido parece não existir ou não é válido. Por favor, use um email real." }
    }

    // Verificar se o email já está em uso
    const barbeariaExistente = await prisma.barbearia.findUnique({
      where: {
        email,
      },
    })

    if (barbeariaExistente) {
      return { error: "Este email já está em uso por outra barbearia" }
    }

    // Gerar slug único
    const baseSlug = generateSlug(nome)
    let slug = baseSlug
    let counter = 1

    // Verificar se o slug já existe e gerar um único
    while (await prisma.barbearia.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
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
        slug,
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

    // Criar prêmios padrão para não-assinantes
    await prisma.premio.createMany({
      data: [
        {
          titulo: "10% de desconto",
          descricao: "Desconto no corte",
          codigo: "DESC10C",
          chance: 40,
          tipoCliente: "nao_assinante",
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "15% em produtos",
          descricao: "Desconto em produtos",
          codigo: "DESC15P",
          chance: 35,
          tipoCliente: "nao_assinante",
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "Brinde especial",
          descricao: "Ganhe um brinde",
          codigo: "BRINDE1",
          chance: 25,
          tipoCliente: "nao_assinante",
          barbeariaId: novaBarbearia.id,
        },
      ],
    })

    // Criar prêmios padrão para assinantes
    await prisma.premio.createMany({
      data: [
        {
          titulo: "30% de desconto",
          descricao: "Desconto no corte + barba",
          codigo: "DESC30CB",
          chance: 30,
          tipoCliente: "assinante",
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "50% em produtos",
          descricao: "Desconto em produtos premium",
          codigo: "DESC50PP",
          chance: 25,
          tipoCliente: "assinante",
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "Corte + Barba grátis",
          descricao: "Serviço completo grátis",
          codigo: "GRATISCB",
          chance: 20,
          tipoCliente: "assinante",
          barbeariaId: novaBarbearia.id,
        },
        {
          titulo: "Kit premium",
          descricao: "Kit completo de produtos",
          codigo: "KITPREM",
          chance: 25,
          tipoCliente: "assinante",
          barbeariaId: novaBarbearia.id,
        },
      ],
    })

    if (modeTeste) {
      // Se for modo teste, redireciona direto para o login
      return {
        success: true,
        barbeariaId: novaBarbearia.id,
        slug: novaBarbearia.slug,
        redirectTo: "/login?cadastro=sucesso",
      }
    } else {
      // Se não for modo teste, redireciona para o checkout
      return {
        success: true,
        barbeariaId: novaBarbearia.id,
        slug: novaBarbearia.slug,
        redirectTo: `/checkout?barbeariaId=${novaBarbearia.id}`,
      }
    }
  } catch (error) {
    console.error("Erro ao cadastrar barbearia:", error)
    return { error: "Erro ao cadastrar barbearia" }
  }
}

// Cadastrar cliente (atualizado para incluir campo assinante)
export async function cadastrarCliente(formData: FormData) {
  try {
    const nome = formData.get("nome") as string
    const email = formData.get("email") as string
    const telefone = formData.get("telefone") as string
    const senha = formData.get("senha") as string
    const barbeariaId = formData.get("barbeariaId") as string
    const assinante = formData.get("assinante") === "true"

    console.log("Dados do cliente:", { nome, email, telefone, barbeariaId, assinante })

    // Verificar se o email é válido
    const emailValido = await isEmailValid(email)
    if (!emailValido) {
      return { error: "O email fornecido parece não existir ou não é válido. Por favor, use um email real." }
    }

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
        assinante,
      },
    })

    console.log("Cliente cadastrado com sucesso:", novoUsuario.id)

    return { success: true, redirectTo: "/login?cadastro=sucesso" }
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error)
    return { error: `Erro ao cadastrar usuário: ${error instanceof Error ? error.message : String(error)}` }
  }
}



