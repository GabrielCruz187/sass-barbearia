import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Marcar prêmio como resgatado
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const jogoId = params.id
    const barbeariaId = session.user.barbeariaId

    // Verificar se o jogo pertence à barbearia
    const jogo = await prisma.jogo.findFirst({
      where: {
        id: jogoId,
        barbeariaId,
      },
    })

    if (!jogo) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    }

    // Verificar se o prêmio já foi resgatado
    if (jogo.resgatado) {
      return NextResponse.json({ error: "Este prêmio já foi resgatado" }, { status: 400 })
    }

    // Verificar se o prêmio está expirado
    if (new Date() > jogo.dataExpiracao) {
      return NextResponse.json({ error: "Este prêmio está expirado" }, { status: 400 })
    }

    // Marcar como resgatado
    const jogoAtualizado = await prisma.jogo.update({
      where: {
        id: jogoId,
      },
      data: {
        resgatado: true,
        dataResgate: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao resgatar prêmio:", error)
    return NextResponse.json({ error: "Erro ao resgatar prêmio" }, { status: 500 })
  }
}
