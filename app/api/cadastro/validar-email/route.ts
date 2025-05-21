import { NextResponse } from "next/server"
import { z } from "zod"
import { isEmailValid } from "@/lib/email-validator"

// Esquema de validação para o email
const emailSchema = z.object({
  email: z.string().email("Email inválido"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validar o formato do email usando Zod
    const result = emailSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({
        valid: false,
        error: result.error.errors[0].message,
      })
    }

    // Verificar se o email realmente existe
    const email = body.email
    const isValid = await isEmailValid(email)

    if (!isValid) {
      return NextResponse.json({
        valid: false,
        error: "Este email parece não existir ou não é válido. Por favor, use um email real.",
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
