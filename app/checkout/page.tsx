"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { StripeCheckoutForm } from "@/components/stripe-checkout-form"

// Carregue o Stripe fora do componente para evitar recriações
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const barbeariaId = searchParams.get("barbeariaId")
  const success = searchParams.get("success") === "true"
  const canceled = searchParams.get("canceled") === "true"
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [freeSlotAvailable, setFreeSlotAvailable] = useState(false)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)

  useEffect(() => {
    // Verificar se ainda há vagas gratuitas disponíveis
    const checkFreeSlots = async () => {
      try {
        const response = await fetch("/api/check-free-slots")
        const data = await response.json()
        setFreeSlotAvailable(data.freeSlotAvailable)
      } catch (error) {
        console.error("Erro ao verificar vagas gratuitas:", error)
        setFreeSlotAvailable(false)
      }
    }

    checkFreeSlots()
  }, [])

  useEffect(() => {
    // Log para depuração
    console.log("Checkout page - barbeariaId:", barbeariaId)
    console.log("Checkout page - success:", success)
    console.log("Checkout page - canceled:", canceled)

    // Se não tiver barbeariaId, redirecionar para a página de cadastro
    // Mas apenas se não estiver em um estado de sucesso ou cancelamento
    if (!barbeariaId && !success && !canceled) {
      // Verificar se o usuário está autenticado
      const checkSession = async () => {
        try {
          // Tentar obter a sessão do usuário
          const response = await fetch("/api/auth/session")
          const session = await response.json()

          // Se o usuário estiver autenticado e tiver um barbeariaId, não redirecionar
          if (session && session.user && session.user.barbeariaId) {
            console.log("Usuário autenticado, não redirecionando")
            return
          }

          console.log("Redirecionando para /cadastro por falta de barbeariaId")
          router.push("/cadastro")
        } catch (error) {
          console.error("Erro ao verificar sessão:", error)
          router.push("/cadastro")
        }
      }

      checkSession()
    }
  }, [barbeariaId, router, success, canceled])

  const createSubscription = async () => {
    if (!barbeariaId) return

    setIsCreatingSubscription(true)
    setError("")

    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barbeariaId,
          plan,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error("Erro ao criar assinatura:", error)
      setError("Ocorreu um erro ao criar a assinatura. Por favor, tente novamente.")
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  const handleActivateFree = async () => {
    if (!barbeariaId) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/activate-free-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barbeariaId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Redirecionar para a página de sucesso
      router.push(`/checkout?success=true`)
    } catch (error) {
      console.error("Erro ao ativar plano gratuito:", error)
      setError("Ocorreu um erro ao ativar o plano gratuito. Por favor, tente novamente.")
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
          <CardTitle className="text-center">Escolha seu Plano</CardTitle>
          <CardDescription className="text-center">Complete o pagamento para ativar sua barbearia</CardDescription>
        </CardHeader>
        <CardContent>
          {freeSlotAvailable && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <span className="font-bold">Parabéns!</span> Você é um dos primeiros a se cadastrar e pode ativar o
                plano gratuitamente!
              </AlertDescription>
            </Alert>
          )}

          {!clientSecret && (
            <>
              <Tabs
                defaultValue="monthly"
                value={plan}
                onValueChange={(value) => setPlan(value as "monthly" | "annual")}
                className="mb-6"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="monthly">Mensal</TabsTrigger>
                  <TabsTrigger value="annual">Anual</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly" className="mt-4">
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Plano Mensal</span>
                      <span className="font-bold">R$199,00/mês</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Acesso a todas as funcionalidades
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Número ilimitado de clientes
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Suporte prioritário
                      </li>
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="annual" className="mt-4">
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Plano Anual</span>
                      <div className="text-right">
                        <span className="font-bold">R$150,00/mês</span>
                        <div className="text-xs text-green-600 font-medium">Economia de 25%</div>
                      </div>
                    </div>
                    <div className="text-sm mb-2">Total: R$1.800,00/ano</div>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Acesso a todas as funcionalidades
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Número ilimitado de clientes
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Suporte prioritário
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Preço fixo garantido por 12 meses
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert className="mb-4 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-800" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
                {freeSlotAvailable ? (
                  <Button
                    onClick={handleActivateFree}
                    className="flex-1"
                    disabled={loading}
                    style={{ backgroundColor: "var(--cor-primaria)" }}
                  >
                    {loading ? "Ativando..." : "Ativar Gratuitamente"}
                  </Button>
                ) : (
                  <Button
                    onClick={createSubscription}
                    className="flex-1"
                    disabled={isCreatingSubscription}
                    style={{ backgroundColor: "var(--cor-primaria)" }}
                  >
                    {isCreatingSubscription ? "Processando..." : "Continuar para Pagamento"}
                  </Button>
                )}
              </div>
            </>
          )}

          {clientSecret && (
            <div className="mt-4">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "var(--cor-primaria)",
                    },
                  },
                }}
              >
                <StripeCheckoutForm barbeariaId={barbeariaId || ""} plan={plan} clientSecret={clientSecret} />
              </Elements>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


