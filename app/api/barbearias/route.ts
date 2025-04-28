import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import prisma from "@/lib/prisma"

// Cadastrar nova barbearia
export async function POST(req: Request) {
  try {
    const { nome, email, telefone, whatsapp, senha, endereco } = await req.json()

    // Verificar se o email já está em uso
    const barbeariaExistente = await prisma.barbearia.findUnique({
      where: {
        email,
      },
    })

    if (barbeariaExistente) {
      return NextResponse.json({ error: "Este email já está em uso por outra barbearia" }, { status: 400 })
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
        configuracao: {
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

    return NextResponse.json(
      {
        id: novaBarbearia.id,
        nome: novaBarbearia.nome,
        email: novaBarbearia.email,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao cadastrar barbearia:", error)
    return NextResponse.json({ error: "Erro ao cadastrar barbearia" }, { status: 500 })
  }
}
