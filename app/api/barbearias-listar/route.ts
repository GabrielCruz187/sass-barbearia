import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Rota alternativa para listar barbearias
export async function GET() {
  try {
    console.log("API Alternativa: Iniciando busca de barbearias")

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

    console.log("API Alternativa: Barbearias encontradas:", barbearias)

    return new NextResponse(JSON.stringify(barbearias), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("API Alternativa: Erro ao listar barbearias:", error)
    return new NextResponse(JSON.stringify({ error: "Erro ao listar barbearias" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
