import { NextResponse } from "next/server"
import { z } from "zod"

// Esquema de validação para o email
const emailSchema = z.object({
  email: z.string().email("Email inválido"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validar o email usando Zod
    const result = emailSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({
        valid: false,
        error: result.error.errors[0].message,
      })
    }

    // Se chegou aqui, o email é válido
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Erro ao validar email:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Erro ao processar a validação",
      },
      { status: 500 },
    )
  }
}
