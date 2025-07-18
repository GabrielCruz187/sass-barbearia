import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.barbeariaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { enabled } = await req.json()

    await prisma.barbearia.update({
      where: {
        id: session.user.barbeariaId,
      },
      data: {
        paginaPersonalizada: enabled,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao alterar página personalizada:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

