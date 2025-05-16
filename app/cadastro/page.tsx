"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Scissors, AlertTriangle, CreditCard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cadastrarBarbearia, cadastrarCliente } from "@/lib/actions/auth-actions"
import { listarBarbearias } from "@/lib/actions/barbearia-actions"

interface Barbearia {
  id: string
  nome: string
  endereco?: string
  logoUrl?: string
}

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("cliente")
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [loadingBarbearias, setLoadingBarbearias] = useState(false)
  const [selectedBarbearia, setSelectedBarbearia] = useState("")
  const [apiError, setApiError] = useState("")
  const [modeTeste, setModeTeste] = useState(false)

  useEffect(() => {
    // Carregar lista de barbearias disponíveis usando Server Action
    const fetchBarbearias = async () => {
      setLoadingBarbearias(true)
      setApiError("")

      try {
        console.log("Tentando buscar barbearias via Server Action...")

        const result = await listarBarbearias()

        if (result.success) {
          console.log("Barbearias carregadas via Server Action:", result.data)
          setBarbearias(result.data || [])

          if (result.data && result.data.length === 0) {
            setApiError("Não há barbearias cadastradas no sistema. Por favor, cadastre uma barbearia primeiro.")
          }
        } else {
          console.error("Erro ao carregar barbearias via Server Action:", result.error)
          setApiError(`Erro ao carregar barbearias: ${result.error}`)
        }
      } catch (error) {
        console.error("Erro ao executar Server Action:", error)
        setApiError(`Erro ao carregar barbearias: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setLoadingBarbearias(false)
      }
    }

    if (activeTab === "cliente") {
      fetchBarbearias()
    }
  }, [activeTab])

  const handleClientRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)

      // Adicionar a barbearia selecionada ao formData
      if (!selectedBarbearia) {
        setError("Por favor, selecione uma barbearia")
        setLoading(false)
        return
      }

      formData.set("barbeariaId", selectedBarbearia)

      const result = await cadastrarCliente(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Se tiver sucesso e um redirecionamento, navegue para a URL
      if (result?.success && result?.redirectTo) {
        router.push(result.redirectTo)
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error)
      setError(`Ocorreu um erro ao realizar o cadastro: ${error instanceof Error ? error.message : String(error)}`)
      setLoading(false)
    }
  }

  const handleAdminRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)

      // Adicionar o modo de teste ao formData
      formData.set("modeTeste", modeTeste.toString())

      console.log("Enviando cadastro de barbearia, modo teste:", modeTeste)

      const result = await cadastrarBarbearia(formData)

      console.log("Resultado do cadastro:", result)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Se tiver sucesso, redirecionar com base no modo de teste
      if (result?.success) {
        const barbeariaId = result.barbeariaId

        if (modeTeste) {
          console.log("Redirecionando para login (modo teste)")
          router.push("/login?cadastro=sucesso")
        } else {
          console.log("Redirecionando para checkout com barbeariaId:", barbeariaId)
          // Usar window.location para forçar um redirecionamento completo
          window.location.href = `/checkout?barbeariaId=${barbeariaId}`
        }
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error)
      setError(`Ocorreu um erro ao realizar o cadastro: ${error instanceof Error ? error.message : String(error)}`)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-800 via-gray-600 to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-800 p-3 rounded-full">
              <Scissors className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Cadastre-se</CardTitle>
          <CardDescription className="text-center">Crie sua conta para começar a usar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="cliente" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="admin">Barbearia</TabsTrigger>
            </TabsList>
            <TabsContent value="cliente">
              <form onSubmit={handleClientRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nome Completo</Label>
                  <Input id="client-name" name="nome" type="text" placeholder="Seu nome completo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input id="client-email" name="email" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Telefone (WhatsApp)</Label>
                  <Input id="client-phone" name="telefone" type="tel" placeholder="(00) 00000-0000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-password">Senha</Label>
                  <Input id="client-password" name="senha" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barbeariaId">Escolha a Barbearia</Label>
                  {loadingBarbearias ? (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                  ) : apiError ? (
                    <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{apiError}</AlertDescription>
                    </Alert>
                  ) : barbearias.length > 0 ? (
                    <Select onValueChange={setSelectedBarbearia} value={selectedBarbearia}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma barbearia" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbearias.map((barbearia) => (
                          <SelectItem key={barbearia.id} value={barbearia.id}>
                            {barbearia.nome} {barbearia.endereco ? `- ${barbearia.endereco}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                      Não há barbearias disponíveis para cadastro. Por favor, tente novamente mais tarde ou cadastre uma
                      barbearia.
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                  disabled={loading || barbearias.length === 0}
                >
                  {loading ? "Cadastrando..." : "Cadastrar como Cliente"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="admin">
              <form onSubmit={handleAdminRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Nome da Barbearia</Label>
                  <Input id="admin-name" name="nome" type="text" placeholder="Nome da sua barbearia" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input id="admin-email" name="email" type="email" placeholder="barbearia@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-phone">Telefone</Label>
                  <Input id="admin-phone" name="telefone" type="tel" placeholder="(00) 00000-0000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-whatsapp">WhatsApp</Label>
                  <Input id="admin-whatsapp" name="whatsapp" type="tel" placeholder="(00) 00000-0000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-endereco">Endereço</Label>
                  <Input id="admin-endereco" name="endereco" type="text" placeholder="Rua, número, bairro, cidade" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha</Label>
                  <Input id="admin-password" name="senha" type="password" required />
                </div>

                <div className="flex items-center space-x-2">
                  
               
                </div>

                {!modeTeste && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <CreditCard className="h-4 w-4 text-blue-800" />
                    <AlertDescription className="text-blue-800">
                      Após o cadastro, você será redirecionado para a página de pagamento.
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white" disabled={loading}>
                  {loading
                    ? "Cadastrando..."
                    : modeTeste
                      ? "Cadastrar em Modo Teste"
                      : "Cadastrar e Prosseguir para Pagamento"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-gray-800 hover:underline">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}



