import { NextResponse } from "next/server"

// Rota de teste simples para verificar se as APIs estão funcionando
export async function GET() {
  console.log("API /test-api - Rota de teste acessada")

  return new NextResponse(
    JSON.stringify({
      status: "success",
      message: "API de teste funcionando corretamente",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}
