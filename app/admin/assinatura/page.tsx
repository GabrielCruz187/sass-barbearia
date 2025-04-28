"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { verificarAssinatura, cancelarAssinatura } from "@/lib/actions/checkout-actions"
import { CheckCircle2, AlertTriangle, CreditCard, XCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AssinaturaPage() {
  const [loading, setLoading] = useState(true)
  const [assinatura, setAssinatura] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [activeTab, setActiveTab] = useState("status")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session")
        const session = await response.json()

        if (!session || !session.user) {
          console.log("Usuário não autenticado, redirecionando para login")
          router.push("/login")
        } else {
          console.log("Usuário autenticado:", session.user.email)
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error)
      }
    }

    checkSession()
  }, [router])

  useEffect(() => {
    const carregarAssinatura = async () => {
      setLoading(true)
      try {
        const result = await verificarAssinatura()
        if (result.error) {
          setError(result.error)
        } else {
          setAssinatura(result)
        }
      } catch (error) {
        setError("Erro ao carregar informações da assinatura")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    carregarAssinatura()
  }, [])

  const handleCancelarAssinatura = async () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura? Isso limitará o acesso ao sistema.")) {
      return
    }

    setCancelando(true)
    try {
      const result = await cancelarAssinatura()
      if (result.error) {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Sucesso", description: "Assinatura cancelada com sucesso" })
        // Recarregar os dados da assinatura
        const assinaturaAtualizada = await verificarAssinatura()
        setAssinatura(assinaturaAtualizada)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao cancelar a assinatura",
        variant: "destructive",
      })
    } finally {
      setCancelando(false)
    }
  }

  const handleRenovarAssinatura = () => {
    router.push(`/checkout?barbeariaId=${assinatura?.barbeariaId}`)
  }

  const handleMudarPlano = () => {
    router.push(`/checkout?barbeariaId=${assinatura?.barbeariaId}&mudarPlano=true`)
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--cor-primaria)" }}>
        Gerenciar Assinatura
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="status">Status da Assinatura</TabsTrigger>
          <TabsTrigger value="planos">Planos Disponíveis</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Status da Assinatura</CardTitle>
              <CardDescription>Informações sobre sua assinatura atual</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : !assinatura ? (
                <div className="p-4 bg-yellow-50 rounded-md">
                  <p className="text-yellow-800">Você não possui uma assinatura ativa.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">Status:</div>
                    <div className="flex items-center">
                      {assinatura.status === "active" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-600 font-medium">Ativa</span>
                        </>
                      ) : assinatura.status === "pending" ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-yellow-600 font-medium">Pendente</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-red-600 font-medium">Cancelada</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="font-medium">Plano:</div>
                    <div className="capitalize">
                      {assinatura.plano === "gratuito" ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Gratuito (Promocional)
                        </span>
                      ) : assinatura.plano === "mensal" ? (
                        <span>Mensal - R$199,00/mês</span>
                      ) : assinatura.plano === "anual" ? (
                        <span>Anual - R$150,00/mês (R$1.800,00/ano)</span>
                      ) : (
                        assinatura.plano || "Mensal"
                      )}
                    </div>
                  </div>

                  {assinatura.dataProximaCobranca && (
                    <div className="flex items-center gap-2">
                      <div className="font-medium">Próxima cobrança:</div>
                      <div>
                        {new Date(assinatura.dataProximaCobranca).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  )}

                  {assinatura.status === "active" && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        Sua assinatura está ativa. Você tem acesso a todos os recursos do sistema.
                      </p>
                    </div>
                  )}

                  {assinatura.status === "pending" && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-md">
                      <p className="text-sm text-yellow-800">
                        Sua assinatura está pendente de pagamento. Complete o pagamento para ter acesso completo ao
                        sistema.
                      </p>
                    </div>
                  )}

                  {assinatura.status === "canceled" && (
                    <div className="mt-6 p-4 bg-red-50 rounded-md">
                      <p className="text-sm text-red-800">
                        Sua assinatura foi cancelada. Renove sua assinatura para ter acesso completo ao sistema.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            {assinatura && (
              <CardFooter className="flex gap-4">
                {assinatura.status === "active" && assinatura.plano !== "gratuito" && (
                  <>
                    <Button variant="outline" onClick={handleMudarPlano}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Mudar de Plano
                    </Button>
                    <Button variant="destructive" onClick={handleCancelarAssinatura} disabled={cancelando}>
                      {cancelando ? "Cancelando..." : "Cancelar Assinatura"}
                    </Button>
                  </>
                )}

                {(assinatura.status === "pending" || assinatura.status === "canceled") && (
                  <Button onClick={handleRenovarAssinatura}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {assinatura.status === "pending" ? "Completar Pagamento" : "Renovar Assinatura"}
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="planos">
          <Card>
            <CardHeader>
              <CardTitle>Planos disponíveis</CardTitle>
              <CardDescription>Escolha o plano que melhor se adapta ao seu negócio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold">Plano Mensal</h3>
                  <div className="mt-2 text-2xl font-bold">
                    R$ 199,00<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span>Acesso a todas as funcionalidades</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span>Número ilimitado de clientes</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span>Suporte prioritário</span>
                    </li>
                  </ul>
                  {assinatura?.plano !== "mensal" && assinatura?.status === "active" && (
                    <Button className="w-full mt-4" onClick={handleMudarPlano}>
                      Mudar para este plano
                    </Button>
                  )}
                </div>

                <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Plano Anual</h3>
                      <div className="mt-2 text-2xl font-bold">
                        R$ 150,00<span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Economize 25%
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Total: R$1.800,00/ano</div>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span>Acesso a todas as funcionalidades</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span>Número ilimitado de clientes</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span>Suporte prioritário</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      <span>Preço fixo garantido por 12 meses</span>
                    </li>
                  </ul>
                  {assinatura?.plano !== "anual" && assinatura?.status === "active" && (
                    <Button className="w-full mt-4" onClick={handleMudarPlano}>
                      Mudar para este plano
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>Registro de todas as transações da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              {assinatura?.plano === "gratuito" ? (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    Você está utilizando o plano gratuito promocional. Não há cobranças associadas à sua conta.
                  </AlertDescription>
                </Alert>
              ) : assinatura?.ultimoPagamento ? (
                <div className="border rounded-md divide-y">
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">Assinatura {assinatura.plano}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(assinatura.ultimoPagamento).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="font-medium">{assinatura.plano === "mensal" ? "R$199,00" : "R$1.800,00"}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground">Nenhum histórico de pagamento disponível.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

