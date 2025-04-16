"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { resgatarPremio } from "@/lib/actions/jogo-actions"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  ultimoJogo: string | null
  premio: string | null
}

interface Jogo {
  id: string
  usuarioId: string
  premioId: string
  resgatado: boolean
  dataExpiracao: string
  createdAt: string
  usuario: {
    nome: string
    email: string
    telefone: string
  }
  premio: {
    titulo: string
    codigo: string
  }
}

export default function ClientesPage() {
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"clientes" | "jogos">("clientes")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar clientes
      const clientesResponse = await fetch("/api/usuarios")
      if (!clientesResponse.ok) {
        throw new Error("Falha ao carregar clientes")
      }
      const clientesData = await clientesResponse.json()
      setClientes(clientesData)

      // Buscar jogos
      const jogosResponse = await fetch("/api/jogos")
      if (!jogosResponse.ok) {
        throw new Error("Falha ao carregar jogos")
      }
      const jogosData = await jogosResponse.json()
      setJogos(jogosData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResgatarPremio = async (jogoId: string) => {
    try {
      const result = await resgatarPremio(jogoId)

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      fetchData()
      toast({
        title: "Prêmio resgatado",
        description: "O prêmio foi marcado como resgatado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao resgatar prêmio:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao resgatar o prêmio",
        variant: "destructive",
      })
    }
  }

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm),
  )

  const filteredJogos = jogos.filter(
    (jogo) =>
      jogo.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jogo.usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jogo.usuario.telefone.includes(searchTerm) ||
      jogo.premio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jogo.premio.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR })
  }

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Clientes</h1>

      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <Button variant={activeTab === "clientes" ? "default" : "outline"} onClick={() => setActiveTab("clientes")}>
            Lista de Clientes
          </Button>
          <Button variant={activeTab === "jogos" ? "default" : "outline"} onClick={() => setActiveTab("jogos")}>
            Histórico de Jogos
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Carregando dados...</div>
          ) : activeTab === "clientes" ? (
            filteredClientes.length === 0 ? (
              <div className="p-6 text-center">
                {searchTerm ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Último Jogo</TableHead>
                    <TableHead>Prêmio Ganho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell>{cliente.ultimoJogo ? formatDate(cliente.ultimoJogo) : "Nunca jogou"}</TableCell>
                      <TableCell>{cliente.premio || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : filteredJogos.length === 0 ? (
            <div className="p-6 text-center">
              {searchTerm ? "Nenhum jogo encontrado para esta busca." : "Nenhum jogo registrado."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJogos.map((jogo) => (
                  <TableRow key={jogo.id}>
                    <TableCell>{formatDate(jogo.createdAt)}</TableCell>
                    <TableCell className="font-medium">{jogo.usuario.nome}</TableCell>
                    <TableCell>{jogo.premio.titulo}</TableCell>
                    <TableCell>
                      <code>{jogo.premio.codigo}</code>
                    </TableCell>
                    <TableCell>{formatDate(jogo.dataExpiracao)}</TableCell>
                    <TableCell>
                      {jogo.resgatado ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Resgatado
                        </Badge>
                      ) : isExpired(jogo.dataExpiracao) ? (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Expirado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!jogo.resgatado && !isExpired(jogo.dataExpiracao) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleResgatarPremio(jogo.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Resgatar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
