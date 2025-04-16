import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { subDays } from "date-fns"

// Obter estatísticas para o dashboard
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const barbeariaId = session.user.barbeariaId
    const dataInicio = subDays(new Date(), 30) // Últimos 30 dias

    // Total de jogos nos últimos 30 dias
    const totalJogos = await prisma.jogo.count({
      where: {
        barbeariaId,
        createdAt: {
          gte: dataInicio,
        },
      },
    })

    // Total de prêmios resgatados nos últimos 30 dias
    const totalResgatados = await prisma.jogo.count({
      where: {
        barbeariaId,
        resgatado: true,
        dataResgate: {
          gte: dataInicio,
        },
      },
    })

    // Novos clientes nos últimos 30 dias
    const novosClientes = await prisma.usuario.count({
      where: {
        barbeariaId,
        role: "CLIENTE",
        createdAt: {
          gte: dataInicio,
        },
      },
    })

    // Distribuição de prêmios
    const distribuicaoPremios = await prisma.jogo.groupBy({
      by: ["premioId"],
      where: {
        barbeariaId,
        createdAt: {
          gte: dataInicio,
        },
      },
      _count: true,
    })

    // Obter detalhes dos prêmios
    const premiosIds = distribuicaoPremios.map((item) => item.premioId)
    const premios = await prisma.premio.findMany({
      where: {
        id: {
          in: premiosIds,
        },
      },
    })

    // Mapear distribuição com nomes dos prêmios
    const distribuicaoFormatada = distribuicaoPremios.map((item) => {
      const premio = premios.find((p) => p.id === item.premioId)
      return {
        premio: premio?.titulo || "Desconhecido",
        quantidade: item._count,
      }
    })

    // Jogos por dia nos últimos 30 dias
    const jogosUltimos30Dias = await prisma.jogo.findMany({
      where: {
        barbeariaId,
        createdAt: {
          gte: dataInicio,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Agrupar por dia
    const jogosPorDia: Record<string, number> = {}
    jogosUltimos30Dias.forEach((jogo) => {
      const data = jogo.createdAt.toISOString().split("T")[0]
      jogosPorDia[data] = (jogosPorDia[data] || 0) + 1
    })

    return NextResponse.json({
      totalJogos,
      totalResgatados,
      novosClientes,
      distribuicaoPremios: distribuicaoFormatada,
      jogosPorDia,
    })
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error)
    return NextResponse.json({ error: "Erro ao obter estatísticas" }, { status: 500 })
  }
}
