"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import "@/app/styles/globals.css"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface DashboardStats {
  totalJogos: number
  totalResgatados: number
  novosClientes: number
  distribuicaoPremios: Array<{
    premio: string
    quantidade: number
  }>
  jogosPorDia: Record<string, number>
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/estatisticas")
        if (!response.ok) {
          throw new Error("Falha ao carregar estatísticas")
        }
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
        setError("Não foi possível carregar as estatísticas. Tente novamente mais tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Preparar dados para o gráfico de barras (jogos por dia)
  const prepareChartData = () => {
    if (!stats?.jogosPorDia) return []

    return Object.entries(stats.jogosPorDia)
      .map(([data, quantidade]) => {
        // Formatar data para exibição (DD/MM)
        const [ano, mes, dia] = data.split("-")
        return {
          data: `${dia}/${mes}`,
          quantidade,
        }
      })
      .slice(-14) // Últimos 14 dias para não sobrecarregar o gráfico
  }

  // Cores para o gráfico de pizza
  const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57", "#ffc658"]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--cor-primaria)" }}>
        Dashboard
      </h1>

      {error && <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Jogos</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalJogos || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prêmios Resgatados</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalResgatados || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.novosClientes || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Jogos por Dia</CardTitle>
            <CardDescription>Últimos 14 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : stats?.jogosPorDia && Object.keys(stats.jogosPorDia).length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="var(--cor-primaria)" name="Jogos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Não há dados suficientes para exibir o gráfico
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Prêmios</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : stats?.distribuicaoPremios && stats.distribuicaoPremios.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.distribuicaoPremios}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quantidade"
                      nameKey="premio"
                      label={({ premio }) => premio}
                    >
                      {stats.distribuicaoPremios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Não há dados suficientes para exibir o gráfico
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
