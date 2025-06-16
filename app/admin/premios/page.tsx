"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, AlertTriangle, RefreshCw, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { adicionarPremio, atualizarPremio, excluirPremio, resetarPremios } from "@/lib/actions/premio-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Premio {
  id: string
  titulo: string
  descricao: string
  codigo: string
  chance: number
  ativo: boolean
  tipoCliente: string
}

export default function PremiosPage() {
  const { toast } = useToast()
  const [premios, setPremios] = useState<Premio[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPremio, setEditingPremio] = useState<Premio | null>(null)
  const [formError, setFormError] = useState("")
  const [somaChancesAssinantes, setSomaChancesAssinantes] = useState(0)
  const [somaChancesNaoAssinantes, setSomaChancesNaoAssinantes] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0) // Para forçar a atualização da lista
  const [apiError, setApiError] = useState<string | null>(null)
  const [testApiResponse, setTestApiResponse] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("premios")

  useEffect(() => {
    fetchPremios()
  }, [refreshKey])

  // Função para testar a API
  const testApi = async () => {
    try {
      setLoading(true)
      console.log("Testando API...")

      // Testar a API de teste
      const response = await fetch("/api/test-api")
      const responseText = await response.text()
      console.log("Resposta da API de teste (texto):", responseText)

      setTestApiResponse(responseText)

      // Testar a API alternativa
      try {
        const altResponse = await fetch("/api/premios-alt")
        const altResponseText = await altResponse.text()
        console.log("Resposta da API alternativa (texto):", altResponseText)

        if (altResponse.ok) {
          const data = JSON.parse(altResponseText)
          setPremios(data)

          // Calcular a soma das chances dos prêmios ativos para assinantes e não assinantes
          const premiosAtivosAssinantes = data.filter(
            (premio: Premio) => premio.ativo && premio.tipoCliente === "assinante",
          )
          const somaAssinantes = premiosAtivosAssinantes.reduce((acc: number, premio: Premio) => acc + premio.chance, 0)
          setSomaChancesAssinantes(somaAssinantes)
          console.log("Soma das chances dos prêmios ativos para assinantes:", somaAssinantes)

          const premiosAtivosNaoAssinantes = data.filter(
            (premio: Premio) => premio.ativo && premio.tipoCliente === "nao-assinante",
          )
          const somaNaoAssinantes = premiosAtivosNaoAssinantes.reduce(
            (acc: number, premio: Premio) => acc + premio.chance,
            0,
          )
          setSomaChancesNaoAssinantes(somaNaoAssinantes)
          console.log("Soma das chances dos prêmios ativos para não assinantes:", somaNaoAssinantes)

          setApiError(null)
          toast({
            title: "Sucesso",
            description: "API alternativa funcionou corretamente!",
          })
        }
      } catch (altError) {
        console.error("Erro ao testar API alternativa:", altError)
      }
    } catch (error) {
      console.error("Erro ao testar API:", error)
      setTestApiResponse(`Erro: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  // Modificar a função fetchPremios para tentar usar a rota alternativa
  const fetchPremios = async () => {
    try {
      setLoading(true)
      setApiError(null)
      console.log("Iniciando busca de prêmios...")

      // Tentar primeiro a rota original
      try {
        const response = await fetch("/api/premios")

        if (response.ok) {
          const data = await response.json()
          console.log("Prêmios carregados da API original:", data)
          setPremios(data)

          // Calcular a soma das chances dos prêmios ativos para assinantes e não assinantes
          const premiosAtivosAssinantes = data.filter(
            (premio: Premio) => premio.ativo && premio.tipoCliente === "assinante",
          )
          const somaAssinantes = premiosAtivosAssinantes.reduce((acc: number, premio: Premio) => acc + premio.chance, 0)
          setSomaChancesAssinantes(somaAssinantes)
          console.log("Soma das chances dos prêmios ativos para assinantes:", somaAssinantes)

          const premiosAtivosNaoAssinantes = data.filter(
            (premio: Premio) => premio.ativo && premio.tipoCliente === "nao-assinante",
          )
          const somaNaoAssinantes = premiosAtivosNaoAssinantes.reduce(
            (acc: number, premio: Premio) => acc + premio.chance,
            0,
          )
          setSomaChancesNaoAssinantes(somaNaoAssinantes)
          console.log("Soma das chances dos prêmios ativos para não assinantes:", somaNaoAssinantes)

          return
        } else {
          console.log("API original falhou, tentando API alternativa...")
        }
      } catch (error) {
        console.error("Erro na API original:", error)
      }

      // Se a rota original falhar, tentar a rota alternativa
      try {
        const altResponse = await fetch("/api/premios-alt")

        if (altResponse.ok) {
          const data = await altResponse.json()
          console.log("Prêmios carregados da API alternativa:", data)
          setPremios(data)

          // Calcular a soma das chances dos prêmios ativos para assinantes e não assinantes
          const premiosAtivosAssinantes = data.filter(
            (premio: Premio) => premio.ativo && premio.tipoCliente === "assinante",
          )
          const somaAssinantes = premiosAtivosAssinantes.reduce((acc: number, premio: Premio) => acc + premio.chance, 0)
          setSomaChancesAssinantes(somaAssinantes)
          console.log("Soma das chances dos prêmios ativos para assinantes:", somaAssinantes)

          const premiosAtivosNaoAssinantes = data.filter(
            (premio: Premio) => premio.ativo && premio.tipoCliente === "nao-assinante",
          )
          const somaNaoAssinantes = premiosAtivosNaoAssinantes.reduce(
            (acc: number, premio: Premio) => acc + premio.chance,
            0,
          )
          setSomaChancesNaoAssinantes(somaNaoAssinantes)
          console.log("Soma das chances dos prêmios ativos para não assinantes:", somaNaoAssinantes)

          return
        } else {
          setApiError(`Erro na API alternativa: ${altResponse.status} ${altResponse.statusText}`)
        }
      } catch (altError) {
        console.error("Erro na API alternativa:", altError)
        setApiError(`Erro na API alternativa: ${altError instanceof Error ? altError.message : String(altError)}`)
      }

      // Se chegou aqui, ambas as APIs falharam
      setApiError("Não foi possível carregar os prêmios. Ambas as APIs falharam.")
    } catch (error) {
      console.error("Erro ao carregar prêmios:", error)
      setApiError(`Erro ao carregar prêmios: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPremio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")

    try {
      const result = await adicionarPremio(new FormData(e.currentTarget))

      if (result.error) {
        setFormError(result.error)
        return
      }

      setOpenDialog(false)
      // Forçar atualização da lista
      setRefreshKey((prev) => prev + 1)
      toast({
        title: "Prêmio adicionado",
        description: "O novo prêmio foi adicionado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao adicionar prêmio:", error)
      setFormError("Ocorreu um erro ao adicionar o prêmio")
    }
  }

  const handleEditPremio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")

    if (!editingPremio) return

    try {
      const result = await atualizarPremio(editingPremio.id, new FormData(e.currentTarget))

      if (result.error) {
        setFormError(result.error)
        return
      }

      setOpenDialog(false)
      setEditingPremio(null)
      // Forçar atualização da lista
      setRefreshKey((prev) => prev + 1)
      toast({
        title: "Prêmio atualizado",
        description: "O prêmio foi atualizado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao atualizar prêmio:", error)
      setFormError("Ocorreu um erro ao atualizar o prêmio")
    }
  }

  const handleDeletePremio = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este prêmio?")) return

    try {
      const result = await excluirPremio(id)

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Forçar atualização da lista
      setRefreshKey((prev) => prev + 1)
      toast({
        title: "Prêmio removido",
        description: "O prêmio foi removido com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir prêmio:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o prêmio",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (premio: Premio) => {
    setEditingPremio(premio)
    setOpenDialog(true)
  }

  // Adicionar esta função ao componente PremiosPage
  const handleResetPremios = async () => {
    if (!confirm("ATENÇÃO: Isso excluirá TODOS os prêmios existentes. Tem certeza que deseja continuar?")) return

    try {
      const result = await resetarPremios()

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Forçar atualização da lista
      setRefreshKey((prev) => prev + 1)
      toast({
        title: "Prêmios resetados",
        description: "Todos os prêmios foram removidos com sucesso",
      })
    } catch (error) {
      console.error("Erro ao resetar prêmios:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao resetar os prêmios",
        variant: "destructive",
      })
    }
  }

  // Adicionar um botão para forçar a atualização da lista
  const handleRefreshList = () => {
    console.log("Forçando atualização da lista de prêmios...")
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "var(--cor-primaria)" }}>
          Prêmios
        </h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={testApi} className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Testar API
          </Button>

          <Button variant="outline" onClick={handleRefreshList} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar Lista
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleResetPremios}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Resetar Prêmios
          </Button>

          <Dialog
            open={openDialog}
            onOpenChange={(open) => {
              setOpenDialog(open)
              if (!open) setEditingPremio(null)
              setFormError("")
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-gray-800 hover:bg-gray-700" style={{ backgroundColor: "var(--cor-primaria)" }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Prêmio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPremio ? "Editar Prêmio" : "Adicionar Novo Prêmio"}</DialogTitle>
                <DialogDescription>
                  {editingPremio
                    ? "Edite os detalhes do prêmio existente."
                    : "Preencha os detalhes para adicionar um novo prêmio ao sistema."}
                </DialogDescription>
              </DialogHeader>

              {formError && <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">{formError}</div>}

              <form onSubmit={editingPremio ? handleEditPremio : handleAddPremio}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titulo">Título do Prêmio</Label>
                    <Input
                      id="titulo"
                      name="titulo"
                      defaultValue={editingPremio?.titulo || ""}
                      placeholder="Ex: 20% de desconto"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      name="descricao"
                      defaultValue={editingPremio?.descricao || ""}
                      placeholder="Ex: Desconto no corte + barba"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="codigo">Código do Prêmio</Label>
                    <Input
                      id="codigo"
                      name="codigo"
                      defaultValue={editingPremio?.codigo || ""}
                      placeholder="Ex: DESC20CB"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="chance">
                      Chance (%) de Sorteio - Disponível:{" "}
                      {(
                        100 -
                        (editingPremio?.tipoCliente === "assinante"
                          ? somaChancesAssinantes
                          : somaChancesNaoAssinantes) +
                        (editingPremio?.chance || 0)
                      ).toFixed(2)}
                      %
                    </Label>
                    <Input
                      id="chance"
                      name="chance"
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      defaultValue={editingPremio?.chance || "25"}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      A soma das chances de todos os prêmios ativos deve ser 100%. Atual:{" "}
                      {(editingPremio?.tipoCliente === "assinante"
                        ? somaChancesAssinantes
                        : somaChancesNaoAssinantes
                      ).toFixed(2)}
                      %
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                    <Select
                      id="tipoCliente"
                      name="tipoCliente"
                      defaultValue={editingPremio?.tipoCliente || "assinante"}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assinante">Assinante</SelectItem>
                        <SelectItem value="nao-assinante">Não Assinante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingPremio && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="ativo">Ativo</Label>
                      <Switch id="ativo" name="ativo" defaultChecked={editingPremio.ativo} value="true" />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenDialog(false)
                      setEditingPremio(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-700"
                    style={{ backgroundColor: "var(--cor-primaria)" }}
                  >
                    {editingPremio ? "Salvar Alterações" : "Adicionar Prêmio"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="premios">Lista de Prêmios</TabsTrigger>
          <TabsTrigger value="debug">Diagnóstico da API</TabsTrigger>
        </TabsList>

        <TabsContent value="premios">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center">Carregando prêmios...</div>
              ) : apiError ? (
                <div className="p-6">
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-800" />
                    <AlertDescription className="text-red-800">Erro ao carregar prêmios: {apiError}</AlertDescription>
                  </Alert>
                  <div className="text-center mt-4">
                    <Button onClick={handleRefreshList} variant="outline" className="mr-2">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </Button>
                    <Button
                      onClick={() => setOpenDialog(true)}
                      className="bg-gray-800 hover:bg-gray-700"
                      style={{ backgroundColor: "var(--cor-primaria)" }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Prêmio
                    </Button>
                  </div>
                </div>
              ) : premios.length === 0 ? (
                <div className="p-6">
                  <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-800" />
                    <AlertDescription className="text-yellow-800">
                      Nenhum prêmio cadastrado. Adicione prêmios para que seus clientes possam jogar e ganhar.
                    </AlertDescription>
                  </Alert>
                  <div className="text-center mt-4">
                    <Button
                      onClick={() => setOpenDialog(true)}
                      className="bg-gray-800 hover:bg-gray-700"
                      style={{ backgroundColor: "var(--cor-primaria)" }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Prêmio
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-center">Chance (%)</TableHead>
                      <TableHead className="text-center">Tipo de Cliente</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {premios.map((premio) => (
                      <TableRow key={premio.id}>
                        <TableCell className="font-medium">{premio.titulo}</TableCell>
                        <TableCell>{premio.descricao}</TableCell>
                        <TableCell>
                          <code>{premio.codigo}</code>
                        </TableCell>
                        <TableCell className="text-center">{premio.chance}%</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              premio.tipoCliente === "assinante"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {premio.tipoCliente === "assinante" ? "Assinante" : "Não Assinante"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              premio.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {premio.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(premio)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletePremio(premio.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Diagnóstico da API</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Teste da API</h3>
                  <Button onClick={testApi} variant="outline" className="mb-2">
                    <Bug className="h-4 w-4 mr-2" />
                    Executar Teste
                  </Button>

                  {testApiResponse && (
                    <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-sm whitespace-pre-wrap">{testApiResponse}</pre>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Informações de Depuração</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p>
                      <strong>Status da API:</strong> {apiError ? "Erro" : "OK"}
                    </p>
                    <p>
                      <strong>Total de Prêmios:</strong> {premios.length}
                    </p>
                    <p>
                      <strong>Soma das Chances para Assinantes:</strong> {somaChancesAssinantes.toFixed(2)}%
                    </p>
                    <p>
                      <strong>Soma das Chances para Não Assinantes:</strong> {somaChancesNaoAssinantes.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Rotas da API</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <ul className="list-disc list-inside space-y-2">
                      <li>
                        <code>/api/premios</code> - Rota principal (GET/POST)
                      </li>
                      <li>
                        <code>/api/premios-alt</code> - Rota alternativa (GET/POST)
                      </li>
                      <li>
                        <code>/api/test-api</code> - Rota de teste (GET)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}




