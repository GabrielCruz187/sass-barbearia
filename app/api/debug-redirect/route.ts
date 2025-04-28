import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { redirectTo } = await req.json()

    console.log("Debug redirect API chamada com:", redirectTo)

    return NextResponse.json({ success: true, message: "Redirecionamento registrado" })
  } catch (error) {
    console.error("Erro na API de debug:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
