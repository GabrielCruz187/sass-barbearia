"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { verificarAssinatura, cancelarAssinatura } from "@/lib/actions/checkout-actions"
import { CheckCircle2, AlertTriangle, CreditCard, XCircle } from "lucide-react"

export default function AssinaturaPage() {
  const [loading, setLoading] = useState(true)
  const [assinatura, setAssinatura] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const { toast } = useRouter()
  const router = useRouter()

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
      <h1 className="text-3xl font-bold mb-6">Gerenciar Assinatura</h1>

      <div className="grid gap-6">
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
                  <div className="capitalize">{assinatura.plano || "Mensal"}</div>
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
              {assinatura.status === "active" && (
                <Button variant="destructive" onClick={handleCancelarAssinatura} disabled={cancelando}>
                  {cancelando ? "Cancelando..." : "Cancelar Assinatura"}
                </Button>
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
                  R$ 49,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
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
              </div>

              <div className="border rounded-lg p-6 bg-muted/50">
                <h3 className="text-lg font-semibold">Plano Teste</h3>
                <div className="mt-2 text-2xl font-bold">
                  Grátis<span className="text-sm font-normal text-muted-foreground"> por 30 dias</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    <span>Acesso a todas as funcionalidades</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    <span>Limitado a 10 clientes</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    <span>Suporte básico</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
