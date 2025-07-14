"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2, Sparkles, Info, Clock } from "lucide-react"
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
  const mudarPlano = searchParams.get("mudarPlano") === "true"
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly")

  // Usar refs para controlar o estado de inicialização e evitar loops
  const initializedRef = useRef(false)
  const checkingFreeSlotRef = useRef(false)
  const loadingBarbeariaRef = useRef(false)
  const activatingFreeRef = useRef(false)
  const activatingTrialRef = useRef(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [freeSlotAvailable, setFreeSlotAvailable] = useState(false)
  const [trialAvailable, setTrialAvailable] = useState(false)
  const [freeSlotMessage, setFreeSlotMessage] = useState("")
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [barbearia, setBarbearia] = useState<any>(null)
  const [sessionBarbeariaId, setSessionBarbeariaId] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [pageInitialized, setPageInitialized] = useState(false)

  // Obter o ID da barbearia da sessão - executado apenas uma vez
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const getSessionInfo = async () => {
      try {
        const response = await fetch("/api/auth/session")
        const session = await response.json()

        if (session && session.user && session.user.barbeariaId) {
          console.log("ID da barbearia na sessão:", session.user.barbeariaId)
          setSessionBarbeariaId(session.user.barbeariaId)
        }

        // Marcar a página como inicializada após obter a sessão
        setPageInitialized(true)
      } catch (error) {
        console.error("Erro ao obter informações da sessão:", error)
        setPageInitialized(true)
      }
    }

    getSessionInfo()
  }, [])

  // Verificar vagas gratuitas - executado apenas uma vez após obter a sessão
  useEffect(() => {
    if (!pageInitialized || checkingFreeSlotRef.current) return
    checkingFreeSlotRef.current = true

    const checkFreeSlots = async () => {
      try {
        console.log("Verificando vagas gratuitas disponíveis...")
        const response = await fetch("/api/check-free-slots")
        const data = await response.json()
        console.log("Resposta da verificação de vagas gratuitas:", data)
        setFreeSlotAvailable(data.freeSlotAvailable)
        setTrialAvailable(data.trialAvailable)
        setFreeSlotMessage(data.message || "")
      } catch (error) {
        console.error("Erro ao verificar vagas gratuitas:", error)
        setFreeSlotAvailable(false)
        setTrialAvailable(true)
      }
    }

    checkFreeSlots()
  }, [pageInitialized])

  // Verificar redirecionamento - executado apenas uma vez após obter a sessão
  useEffect(() => {
    if (!pageInitialized) return

    // Se não tiver barbeariaId, redirecionar para a página de cadastro
    // Mas apenas se não estiver em um estado de sucesso ou cancelamento
    if (!barbeariaId && !sessionBarbeariaId && !success && !canceled) {
      console.log("Redirecionando para /cadastro por falta de barbeariaId")
      router.push("/cadastro")
    }
  }, [barbeariaId, sessionBarbeariaId, router, success, canceled, pageInitialized])

  // Carregar informações da barbearia - executado apenas uma vez após obter a sessão
  useEffect(() => {
    if (!pageInitialized || loadingBarbeariaRef.current) return
    if (!barbeariaId && !sessionBarbeariaId) return

    loadingBarbeariaRef.current = true

    const carregarBarbearia = async () => {
      // Usar o ID da sessão se disponível, caso contrário usar o ID da URL
      const idToUse = sessionBarbeariaId || barbeariaId

      if (!idToUse) {
        console.error("ID da barbearia não fornecido")
        setError("ID da barbearia não fornecido")
        return
      }

      console.log("Carregando informações da barbearia:", idToUse)

      try {
        setLoading(true)
        const result = await getBarbeariaInfo(idToUse)

        console.log("Resultado da busca da barbearia:", result)

        if (result.error) {
          setError(result.error)
        } else if (result.success && result.data) {
          setBarbearia(result.data)

          // Verificar se já tem assinatura ativa
          if (result.data.assinatura && result.data.assinatura.status === "active") {
            setHasActiveSubscription(true)

            // Se não estiver tentando mudar de plano, redirecionar para o dashboard
            if (!mudarPlano) {
              toast({
                title: "Assinatura ativa",
                description: "Sua barbearia já possui uma assinatura ativa.",
                variant: "default",
              })

              // Aguardar um pouco antes de redirecionar
              setTimeout(() => {
                router.push("/admin/dashboard")
              }, 2000)
            }
          }
        } else {
          setError("Erro ao carregar informações da barbearia")
        }
      } catch (error) {
        console.error("Erro ao carregar barbearia:", error)
        setError("Erro ao carregar informações da barbearia")
      } finally {
        setLoading(false)
      }
    }

    carregarBarbearia()
  }, [barbeariaId, sessionBarbeariaId, router, mudarPlano, toast, pageInitialized])

  const createSubscription = async () => {
    // Evitar múltiplos cliques
    if (isCreatingSubscription) return

    // Usar o ID da sessão se disponível, caso contrário usar o ID da URL
    const idToUse = sessionBarbeariaId || barbeariaId

    if (!idToUse) {
      setError("ID da barbearia não fornecido")
      return
    }

    setIsCreatingSubscription(true)
    setError("")

    try {
      console.log("Criando assinatura para barbearia:", idToUse)

      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barbeariaId: idToUse,
          plan,
          forceUpdate: mudarPlano, // Indicar se é uma mudança de plano
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro na resposta da API:", errorData)

        // Se já tem assinatura ativa e não está tentando mudar de plano
        if (errorData.error === "Barbearia já possui uma assinatura ativa" && !mudarPlano) {
          setHasActiveSubscription(true)
          toast({
            title: "Assinatura ativa",
            description: "Sua barbearia já possui uma assinatura ativa.",
            variant: "default",
          })

          // Aguardar um pouco antes de redirecionar
          setTimeout(() => {
            router.push("/admin/dashboard")
          }, 2000)
          return
        }

        setError(errorData.error || "Erro ao criar assinatura")
        return
      }

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
    // Evitar múltiplos cliques e loops
    if (loading || activatingFreeRef.current) return
    activatingFreeRef.current = true

    // Usar o ID da sessão se disponível, caso contrário usar o ID da URL
    const idToUse = sessionBarbeariaId || barbeariaId

    if (!idToUse) {
      setError("ID da barbearia não fornecido")
      activatingFreeRef.current = false
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Ativando plano gratuito para barbearia:", idToUse)

      const response = await fetch("/api/activate-free-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barbeariaId: idToUse,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error("Erro ao ativar plano gratuito:", data.error)
        setError(data.error)
        setLoading(false)
        activatingFreeRef.current = false
        return
      }

      console.log("Plano gratuito ativado com sucesso, redirecionando...")

      // Redirecionar para a página de sucesso
      router.push(`/checkout?success=true`)
    } catch (error) {
      console.error("Erro ao ativar plano gratuito:", error)
      setError("Ocorreu um erro ao ativar o plano gratuito. Por favor, tente novamente.")
      setLoading(false)
      activatingFreeRef.current = false
    }
  }

  const handleActivateTrial = async () => {
    // Evitar múltiplos cliques e loops
    if (loading || activatingTrialRef.current) return
    activatingTrialRef.current = true

    // Usar o ID da sessão se disponível, caso contrário usar o ID da URL
    const idToUse = sessionBarbeariaId || barbeariaId

    if (!idToUse) {
      setError("ID da barbearia não fornecido")
      activatingTrialRef.current = false
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Ativando trial para barbearia:", idToUse)

      const response = await fetch("/api/activate-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barbeariaId: idToUse,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error("Erro ao ativar trial:", data.error)
        setError(data.error)
        setLoading(false)
        activatingTrialRef.current = false
        return
      }

      console.log("Trial ativado com sucesso, redirecionando...")

      // Redirecionar para a página de sucesso
      router.push(`/checkout?success=true`)
    } catch (error) {
      console.error("Erro ao ativar trial:", error)
      setError("Ocorreu um erro ao ativar o período de teste. Por favor, tente novamente.")
      setLoading(false)
      activatingTrialRef.current = false
    }
  }

  const handleCancel = () => {
    // Usar o ID da sessão se disponível, caso contrário usar o ID da URL
    const idToUse = sessionBarbeariaId || barbeariaId
    router.push(`/checkout?canceled=true&barbeariaId=${idToUse}`)
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
            <CardTitle className="text-center">Ativação Confirmada!</CardTitle>
            <CardDescription className="text-center">Sua barbearia foi ativada com sucesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200 mb-4">
              <AlertDescription className="text-green-800">
                Sua barbearia está pronta para uso. Você pode acessar o sistema agora.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/admin/dashboard")}>Ir para o Dashboard</Button>
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
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              Ir para o Dashboard
            </Button>
            <Button
              onClick={() => {
                // Usar o ID da sessão se disponível, caso contrário usar o ID da URL
                const idToUse = sessionBarbeariaId || barbeariaId
                router.push(`/checkout?barbeariaId=${idToUse}`)
              }}
            >
              Tentar Novamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Renderizar mensagem de assinatura ativa (quando não está tentando mudar de plano)
  if (hasActiveSubscription && !mudarPlano) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <CardTitle className="text-center">Assinatura Ativa</CardTitle>
            <CardDescription className="text-center">Sua barbearia já possui uma assinatura ativa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-blue-50 border-blue-200 mb-4">
              <Info className="h-4 w-4 text-blue-800" />
              <AlertDescription className="text-blue-800">
                Você já tem acesso completo ao sistema. Não é necessário realizar um novo pagamento.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => router.push("/admin/dashboard")}>Ir para o Dashboard</Button>
            <Button variant="outline" onClick={() => router.push("/admin/assinatura")}>
              Gerenciar Assinatura
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{mudarPlano ? "Alterar Plano" : "Escolha seu Plano"}</CardTitle>
          <CardDescription className="text-center">
            {mudarPlano ? "Escolha um novo plano para sua barbearia" : "Ative sua barbearia e comece a usar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {freeSlotAvailable && !mudarPlano && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <Sparkles className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <span className="font-bold">🎉 Parabéns!</span> {freeSlotMessage}
              </AlertDescription>
            </Alert>
          )}

          {trialAvailable && !freeSlotAvailable && !mudarPlano && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <span className="font-bold">⏰ Teste Grátis!</span> {freeSlotMessage}
              </AlertDescription>
            </Alert>
          )}

          {mudarPlano && barbearia?.assinatura?.plano && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <span className="font-bold">Plano atual:</span>{" "}
                {barbearia.assinatura.plano === "mensal"
                  ? "Mensal (R$199,00/mês)"
                  : barbearia.assinatura.plano === "anual"
                    ? "Anual (R$119,99/mês)"
                    : barbearia.assinatura.plano}
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
                      <div className="text-right">
                        <span className="font-bold">R$398,00</span>
                        <div className="text-xs text-gray-600">1º mês: Taxa + Mensalidade</div>
                      </div>
                    </div>
                    <div className="text-sm mb-2 text-gray-600">Próximas mensalidades: R$199,00/mês</div>
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
                        <span className="font-bold">R$1.638,88</span>
                        <div className="text-xs text-green-600 font-medium">Taxa + 1º ano</div>
                      </div>
                    </div>
                    <div className="text-sm mb-2 text-gray-600">
                      Taxa de adesão: R$199,00 + Primeiro ano: R$1.439,88
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
                <Button
                  variant="outline"
                  onClick={() => router.push(mudarPlano ? "/admin/assinatura" : "/admin/dashboard")}
                  className="flex-1"
                >
                  Cancelar
                </Button>

                {freeSlotAvailable && !mudarPlano ? (
                  <Button
                    onClick={handleActivateFree}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading || activatingFreeRef.current}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                        Ativando...
                      </span>
                    ) : (
                      "🎉 Ativar Gratuitamente"
                    )}
                  </Button>
                ) : trialAvailable && !mudarPlano ? (
                  <Button
                    onClick={handleActivateTrial}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading || activatingTrialRef.current}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                        Ativando...
                      </span>
                    ) : (
                      "⏰ Iniciar Teste Grátis"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={createSubscription}
                    className="flex-1"
                    disabled={isCreatingSubscription}
                    style={{ backgroundColor: "var(--cor-primaria)" }}
                  >
                    {isCreatingSubscription
                      ? "Processando..."
                      : mudarPlano
                        ? "Mudar Plano"
                        : "Continuar para Pagamento"}
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
                <StripeCheckoutForm
                  barbeariaId={sessionBarbeariaId || barbeariaId || ""}
                  plan={plan}
                  clientSecret={clientSecret}
                  isChangingPlan={mudarPlano}
                />
              </Elements>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function getBarbeariaInfo(barbeariaId: string) {
  try {
    if (!barbeariaId || barbeariaId === "null") {
      return { success: false, error: "ID da barbearia não fornecido ou inválido" }
    }

    const response = await fetch(`/api/get-barbearia?barbeariaId=${barbeariaId}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro ao buscar barbearia:", errorData)
      return { success: false, error: errorData.message || "Erro ao buscar barbearia" }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Erro ao buscar barbearia:", error)
    return { success: false, error: "Erro ao buscar barbearia" }
  }
}















