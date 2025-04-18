import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Rota de depuração para listar todas as barbearias
export async function GET() {
  try {
    console.log("API Debug: Verificando conexão com o banco de dados")

    // Testar conexão com o banco de dados
    await prisma.$queryRaw`SELECT 1`
    console.log("API Debug: Conexão com o banco de dados OK")

    // Contar barbearias
    const count = await prisma.barbearia.count()
    console.log(`API Debug: Total de barbearias: ${count}`)

    // Buscar todas as barbearias
    const barbearias = await prisma.barbearia.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        createdAt: true,
      },
    })

    console.log("API Debug: Barbearias encontradas:", barbearias)

    return new NextResponse(
      JSON.stringify({
        status: "success",
        dbConnection: "OK",
        count,
        barbearias,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("API Debug: Erro ao verificar banco de dados:", error)

    return new NextResponse(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : null,
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
