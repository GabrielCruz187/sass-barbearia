"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const barbeariaId = searchParams.get("barbeariaId")
  const success = searchParams.get("success") === "true"
  const canceled = searchParams.get("canceled") === "true"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")

  useEffect(() => {
    // Log para depuração
    console.log("Checkout page - barbeariaId:", barbeariaId)
    console.log("Checkout page - success:", success)
    console.log("Checkout page - canceled:", canceled)

    // Se não tiver barbeariaId, redirecionar para a página de cadastro
    if (!barbeariaId && !success && !canceled) {
      console.log("Redirecionando para /cadastro por falta de barbeariaId")
      router.push("/cadastro")
    }
  }, [barbeariaId, router, success, canceled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validação básica
    if (!cardNumber || !cardName || !cardExpiry || !cardCvc) {
      setError("Por favor, preencha todos os campos do cartão")
      setLoading(false)
      return
    }

    try {
      // Simulação de processamento de pagamento
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Armazenar no localStorage que esta barbearia "pagou"
      if (typeof window !== "undefined" && barbeariaId) {
        const paidBarbearias = JSON.parse(localStorage.getItem("paidBarbearias") || "[]")
        if (!paidBarbearias.includes(barbeariaId)) {
          paidBarbearias.push(barbeariaId)
          localStorage.setItem("paidBarbearias", JSON.stringify(paidBarbearias))
        }
      }

      // Redirecionar para a página de sucesso
      router.push(`/checkout?success=true`)
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      setError("Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.")
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/checkout?canceled=true&barbeariaId=${barbeariaId}`)
  }

  // Renderizar mensagem de sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <CardTitle className="text-center">Pagamento Confirmado!</CardTitle>
            <CardDescription className="text-center">Sua assinatura foi ativada com sucesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200 mb-4">
              <AlertDescription className="text-green-800">
                Sua barbearia está pronta para uso. Você pode acessar o sistema agora.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/login")}>Ir para o Login</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Renderizar mensagem de cancelamento
  if (canceled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Pagamento Cancelado</CardTitle>
            <CardDescription className="text-center">Você cancelou o processo de pagamento.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-yellow-50 border-yellow-200 mb-4">
              <AlertTriangle className="h-4 w-4 text-yellow-800" />
              <AlertDescription className="text-yellow-800">
                Sua barbearia foi cadastrada, mas está em modo limitado até que você complete o pagamento.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Ir para o Login
            </Button>
            <Button onClick={() => router.push(`/checkout?barbeariaId=${barbeariaId}`)}>Tentar Novamente</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Assinatura Premium</CardTitle>
          <CardDescription className="text-center">Complete o pagamento para ativar sua barbearia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Plano Premium</span>
              <span className="font-semibold">R$49,90/mês</span>
            </div>
            <div className="text-sm text-gray-500">Acesso completo a todas as funcionalidades</div>
          </div>

          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-800" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Número do Cartão</Label>
              <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <CreditCard className="ml-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-name">Nome no Cartão</Label>
              <Input
                id="card-name"
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-expiry">Validade</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/AA"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cvc">CVC</Label>
                <Input id="card-cvc" placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button variant="outline" type="button" className="flex-1" onClick={handleCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Processando..." : "Pagar R$49,90"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-xs text-center text-gray-500">
            <p>Este é um ambiente de demonstração. Nenhum cartão real será cobrado.</p>
            <p className="mt-1">Você pode usar qualquer número de cartão para testar.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
