"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Scissors } from "lucide-react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || ""
  const cadastroSucesso = searchParams.get("cadastro") === "sucesso"
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Adicionar log para debug
  useEffect(() => {
    console.log("CallbackUrl:", callbackUrl)
  }, [callbackUrl])

  const handleClientLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      console.log("Tentando login como cliente com:", { email, userType: "cliente" })
      const result = await signIn("credentials", {
        email,
        password,
        userType: "cliente",
        redirect: false,
        callbackUrl: "/cliente/jogo",
      })

      console.log("Resultado do login cliente:", result)

      if (result?.error) {
        setError("Email ou senha inválidos")
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Redirecionar para a página do cliente
        toast({
          title: "Login bem-sucedido",
          description: "Redirecionando para a área do cliente...",
        })

        // Pequeno atraso para garantir que a sessão seja estabelecida
        setTimeout(() => {
          router.push(callbackUrl || "/cliente/jogo")
        }, 500)
      }
    } catch (error) {
      console.error("Erro no login cliente:", error)
      setError("Ocorreu um erro ao fazer login")
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      console.log("Tentando login como barbearia com:", { email, userType: "barbearia" })
      const result = await signIn("credentials", {
        email,
        password,
        userType: "barbearia",
        redirect: false,
        callbackUrl: "/admin/dashboard",
      })

      console.log("Resultado do login barbearia:", result)

      if (result?.error) {
        setError("Email ou senha inválidos")
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Redirecionar para o dashboard de admin
        toast({
          title: "Login bem-sucedido",
          description: "Redirecionando para o painel administrativo...",
        })

        // Pequeno atraso para garantir que a sessão seja estabelecida
        setTimeout(() => {
          router.push(callbackUrl || "/admin/dashboard")
        }, 500)
      }
    } catch (error) {
      console.error("Erro no login admin:", error)
      setError("Ocorreu um erro ao fazer login")
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
          <CardTitle className="text-2xl text-center">Entrar no Sistema</CardTitle>
          <CardDescription className="text-center">Escolha como deseja entrar no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {cadastroSucesso && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>Cadastro realizado com sucesso! Faça login para continuar.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="cliente" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="admin">Barbearia</TabsTrigger>
            </TabsList>
            <TabsContent value="cliente">
              <form onSubmit={handleClientLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input id="client-email" name="email" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-password">Senha</Label>
                  <Input id="client-password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar como Cliente"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email da Barbearia</Label>
                  <Input id="admin-email" name="email" type="email" placeholder="barbearia@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha</Label>
                  <Input id="admin-password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar como Administrador"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="text-purple-600 hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
