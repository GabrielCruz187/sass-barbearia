import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Rota alternativa para obter prêmios da barbearia
export async function GET(req: Request) {
  try {
    console.log("API /premios-alt - Iniciando processamento da requisição")

    const session = await getServerSession(authOptions)
    console.log("API /premios-alt - Session:", session ? "Autenticado" : "Não autenticado")

    if (!session) {
      console.log("API /premios-alt - Erro: Não autorizado (sem sessão)")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId
    console.log("API /premios-alt - BarbeariaId:", barbeariaId)

    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
      },
      orderBy: {
        chance: "desc",
      },
    })

    console.log(`API /premios-alt - Prêmios encontrados: ${premios.length}`)

    // Garantir que estamos retornando JSON válido
    return new NextResponse(JSON.stringify(premios), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("API /premios-alt - Erro ao obter prêmios:", error)

    // Garantir que o erro também retorne JSON válido
    return new NextResponse(
      JSON.stringify({
        error: "Erro ao obter prêmios",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

// Adicionar novo prêmio
export async function POST(req: Request) {
  try {
    console.log("API /premios-alt - Iniciando processamento do POST")

    const session = await getServerSession(authOptions)
    console.log("API /premios-alt - Session POST:", session ? "Autenticado" : "Não autenticado")

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { titulo, descricao, chance, codigo } = await req.json()
    const barbeariaId = session.user.barbeariaId

    console.log("API /premios-alt - Adicionando prêmio:", { titulo, descricao, codigo, chance, barbeariaId })

    // Verificar se a soma das chances não ultrapassa 100%
    const premiosExistentes = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true, // Considerar apenas prêmios ativos
      },
      select: {
        chance: true,
      },
    })

    const somaChancesExistentes = premiosExistentes.reduce((soma, premio) => soma + premio.chance, 0)
    console.log("API /premios-alt - Soma das chances existentes:", somaChancesExistentes)
    console.log("API /premios-alt - Nova chance:", chance)
    console.log("API /premios-alt - Soma total:", somaChancesExistentes + chance)

    if (somaChancesExistentes + chance > 100) {
      return NextResponse.json(
        {
          error: `A soma das chances não pode ultrapassar 100%. Soma atual: ${somaChancesExistentes.toFixed(2)}%, disponível: ${(100 - somaChancesExistentes).toFixed(2)}%`,
        },
        { status: 400 },
      )
    }

    // Criar novo prêmio
    const novoPremio = await prisma.premio.create({
      data: {
        titulo,
        descricao,
        codigo,
        chance,
        barbeariaId,
      },
    })

    return NextResponse.json(novoPremio, { status: 201 })
  } catch (error) {
    console.error("API /premios-alt - Erro ao adicionar prêmio:", error)
    return NextResponse.json({ error: "Erro ao adicionar prêmio" }, { status: 500 })
  }
}
