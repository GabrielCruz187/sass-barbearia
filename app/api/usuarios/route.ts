import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Cadastrar novo usuário (cliente)
export async function POST(req: Request) {
  try {
    const { nome, email, telefone, senha, barbeariaId } = await req.json()

    // Verificar se o email já está em uso para esta barbearia
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        email,
        barbeariaId,
      },
    })

    if (usuarioExistente) {
      return NextResponse.json({ error: "Este email já está em uso" }, { status: 400 })
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

    return NextResponse.json(
      {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error)
    return NextResponse.json({ error: "Erro ao cadastrar usuário" }, { status: 500 })
  }
}

// Obter lista de usuários (apenas para admin)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId

    const usuarios = await prisma.usuario.findMany({
      where: {
        barbeariaId,
        role: "CLIENTE",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAt: true,
        jogos: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            premio: true,
          },
        },
      },
    })

    // Formatar dados para o frontend
    const usuariosFormatados = usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      ultimoJogo: usuario.jogos[0]?.createdAt || null,
      premio: usuario.jogos[0]?.premio.titulo || null,
    }))

    return NextResponse.json(usuariosFormatados)
  } catch (error) {
    console.error("Erro ao obter usuários:", error)
    return NextResponse.json({ error: "Erro ao obter usuários" }, { status: 500 })
  }
}
