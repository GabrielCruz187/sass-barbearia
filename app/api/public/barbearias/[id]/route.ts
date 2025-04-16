import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Obter informações públicas da barbearia pelo ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const barbeariaId = params.id

    const barbearia = await prisma.barbearia.findUnique({
      where: {
        id: barbeariaId,
      },
      select: {
        id: true,
        nome: true,
        logoUrl: true,
        corPrimaria: true,
        corSecundaria: true,
      },
    })

    if (!barbearia) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    return NextResponse.json(barbearia)
  } catch (error) {
    console.error("Erro ao obter informações da barbearia:", error)
    return NextResponse.json({ error: "Erro ao obter informações da barbearia" }, { status: 500 })
  }
}
