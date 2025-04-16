"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { adicionarPremio, atualizarPremio, excluirPremio } from "@/lib/actions/premio-actions"

interface Premio {
  id: string
  titulo: string
  descricao: string
  codigo: string
  chance: number
  ativo: boolean
}

export default function PremiosPage() {
  const { toast } = useToast()
  const [premios, setPremios] = useState<Premio[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPremio, setEditingPremio] = useState<Premio | null>(null)
  const [formError, setFormError] = useState("")
  const [somaChances, setSomaChances] = useState(0)

  useEffect(() => {
    fetchPremios()
  }, [])

  const fetchPremios = async () => {
    try {
      const response = await fetch("/api/premios")
      if (!response.ok) {
        throw new Error("Falha ao carregar prêmios")
      }
      const data = await response.json()
      setPremios(data)

      // Calcular a soma das chances dos prêmios ativos
      const premiosAtivos = data.filter((premio: Premio) => premio.ativo)
      const soma = premiosAtivos.reduce((acc: number, premio: Premio) => acc + premio.chance, 0)
      setSomaChances(soma)
      console.log("Soma das chances dos prêmios ativos:", soma)
    } catch (error) {
      console.error("Erro ao carregar prêmios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os prêmios",
        variant: "destructive",
      })
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
      fetchPremios()
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
      fetchPremios()
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

      fetchPremios()
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prêmios</h1>

        <Dialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open)
            if (!open) setEditingPremio(null)
            setFormError("")
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
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
                    Chance (%) de Sorteio - Disponível: {(100 - somaChances + (editingPremio?.chance || 0)).toFixed(2)}%
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
                    A soma das chances de todos os prêmios ativos deve ser 100%. Atual: {somaChances.toFixed(2)}%
                  </p>
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
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingPremio ? "Salvar Alterações" : "Adicionar Prêmio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Carregando prêmios...</div>
          ) : premios.length === 0 ? (
            <div className="p-6 text-center">Nenhum prêmio cadastrado. Clique em "Novo Prêmio" para adicionar.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-center">Chance (%)</TableHead>
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
    </div>
  )
}
