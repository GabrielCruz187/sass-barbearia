import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Listar todas as barbearias disponíveis para cadastro de clientes
export async function GET() {
  try {
    console.log("API: Iniciando busca de barbearias para listagem pública")

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

    console.log("API: Barbearias encontradas para listagem:", barbearias)

    // Garantir que estamos retornando JSON válido
    return new NextResponse(JSON.stringify(barbearias), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("API: Erro ao listar barbearias:", error)

    // Garantir que o erro também retorne JSON válido
    return new NextResponse(JSON.stringify({ error: "Erro ao listar barbearias" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
