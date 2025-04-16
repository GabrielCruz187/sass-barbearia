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
        configuracoes: {
          create: {
            limiteJogosMes: 1,
            diasValidade: 30,
          },
        },
      },
    })

    // Criar prêmios padrão para a barbearia
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
          titulo: "🏆 Corte grátis",
          descricao: "Um corte de cabelo grátis",
          codigo: "CORTEGRATIS",
          chance: 5,
          barbeariaId: novaBarbearia.id,
        },
      ],
    })

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
    let barbeariaId = formData.get("barbeariaId") as string

    console.log("Dados do cliente:", { nome, email, telefone, barbeariaId })

    // Verificar se existe uma barbearia para associar o cliente
    // Se não for fornecido um ID válido, buscar a primeira barbearia disponível
    if (!barbeariaId || barbeariaId === "barbearia-demo-id") {
      const primeiraBarbearia = await prisma.barbearia.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      })

      if (primeiraBarbearia) {
        barbeariaId = primeiraBarbearia.id
        console.log("Usando barbearia existente:", barbeariaId)
      } else {
        // Se não existir nenhuma barbearia, criar uma barbearia de demonstração
        console.log("Criando barbearia de demonstração")
        const demoBarbearia = await prisma.barbearia.create({
          data: {
            nome: "Barbearia Demonstração",
            email: "demo@barbearia.com",
            telefone: "11999999999",
            whatsapp: "11999999999",
            senha: await hash("senha123", 10),
            configuracoes: {
              create: {
                limiteJogosMes: 1,
                diasValidade: 30,
              },
            },
          },
        })

        barbeariaId = demoBarbearia.id
        console.log("Barbearia de demonstração criada:", barbeariaId)

        // Criar prêmios padrão para a barbearia de demonstração
        await prisma.premio.createMany({
          data: [
            {
              titulo: "20% de desconto",
              descricao: "Desconto no corte + barba",
              codigo: "DESC20CB",
              chance: 40,
              barbeariaId: demoBarbearia.id,
            },
            {
              titulo: "30% em produtos",
              descricao: "Desconto em produtos de barba",
              codigo: "DESC30PB",
              chance: 30,
              barbeariaId: demoBarbearia.id,
            },
            {
              titulo: "20% em pomada",
              descricao: "Desconto em pomada",
              codigo: "DESC20POM",
              chance: 25,
              barbeariaId: demoBarbearia.id,
            },
            {
              titulo: "🏆 Corte grátis",
              descricao: "Um corte de cabelo grátis",
              codigo: "CORTEGRATIS",
              chance: 5,
              barbeariaId: demoBarbearia.id,
            },
          ],
        })
      }
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

