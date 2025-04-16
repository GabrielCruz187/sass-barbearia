"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cadastrarBarbearia, cadastrarCliente } from "@/lib/actions/auth-actions"

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("cliente")

  const handleClientRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)

      // Não precisamos mais adicionar um barbeariaId fixo aqui
      // A função cadastrarCliente vai lidar com isso automaticamente

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
      const result = await cadastrarBarbearia(new FormData(e.currentTarget))

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-500 to-pink-500 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600 p-3 rounded-full">
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
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
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
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar Barbearia"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-purple-600 hover:underline">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

