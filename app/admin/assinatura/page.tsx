"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertTriangle, Clock, CreditCard, Calendar, Star, Zap, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AssinaturaInfo {
  hasSubscription: boolean
  status: string | null
  plan: string | null
  dataProximaCobranca: string | null
  ultimoPagamento: string | null
  expired?: boolean
}

export default function AssinaturaPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [assinaturaInfo, setAssinaturaInfo] = useState<AssinaturaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.barbeariaId) {
      checkSubscriptionStatus()
    }
  }, [session])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/check-subscription-status?barbeariaId=${session?.user?.barbeariaId}`)
      const data = await response.json()
      setAssinaturaInfo(data)
    } catch (error) {
      console.error("Erro ao verificar status da assinatura:", error)
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status da assinatura.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeplan = () => {
    router.push(`/checkout?barbeariaId=${session?.user?.barbeariaId}&mudarPlano=true`)
  }

  const handleSubscribe = () => {
    if (assinaturaInfo?.expired) {
      router.push(`/checkout?barbeariaId=${session?.user?.barbeariaId}&expired=true`)
    } else {
      router.push(`/checkout?barbeariaId=${session?.user?.barbeariaId}`)
    }
  }

  const getStatusBadge = (status: string | null, plan: string | null) => {
    if (status === "active") {
      if (plan === "gratuito") {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Star className="w-3 h-3 mr-1" />
            Gratuito
          </Badge>
        )
      } else if (plan === "trial") {
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Trial
          </Badge>
        )
      } else if (plan === "mensal") {
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Zap className="w-3 h-3 mr-1" />
            Mensal
          </Badge>
        )
      } else if (plan === "anual") {
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Crown className="w-3 h-3 mr-1" />
            Anual
          </Badge>
        )
      }
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      )
    } else if (status === "expired") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      )
    }
    return <Badge variant="secondary">Inativo</Badge>
  }

  const getPlanName = (plan: string | null) => {
    switch (plan) {
      case "gratuito":
        return "Plano Gratuito"
      case "trial":
        return "Período de Teste"
      case "mensal":
        return "Plano Mensal"
      case "anual":
        return "Plano Anual"
      default:
        return "Sem plano"
    }
  }

  const getPlanPrice = (plan: string | null) => {
    switch (plan) {
      case "gratuito":
        return "R$ 0,00"
      case "trial":
        return "Gratuito por 7 dias"
      case "mensal":
        return "R$ 99,90/mês"
      case "anual":
        return "R$ 49,99/mês"
      default:
        return "-"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assinatura</h1>
          <p className="text-gray-600">Gerencie sua assinatura e planos</p>
        </div>
      </div>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Status da Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assinaturaInfo?.hasSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{getPlanName(assinaturaInfo.plan)}</h3>
                  <p className="text-gray-600">{getPlanPrice(assinaturaInfo.plan)}</p>
                </div>
                {getStatusBadge(assinaturaInfo.status, assinaturaInfo.plan)}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Último Pagamento</p>
                  <p className="font-medium">{formatDate(assinaturaInfo.ultimoPagamento)}</p>
                </div>
                {assinaturaInfo.dataProximaCobranca && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {assinaturaInfo.plan === "trial" ? "Expira em" : "Próxima Cobrança"}
                    </p>
                    <p className="font-medium">{formatDate(assinaturaInfo.dataProximaCobranca)}</p>
                  </div>
                )}
              </div>

              {assinaturaInfo.expired && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Seu período de teste expirou. Escolha um plano para continuar usando o sistema.
                  </AlertDescription>
                </Alert>
              )}

              {assinaturaInfo.status === "active" && assinaturaInfo.plan === "trial" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Você está no período de teste. Aproveite para conhecer todas as funcionalidades!
                  </AlertDescription>
                </Alert>
              )}

              {assinaturaInfo.status === "active" && assinaturaInfo.plan === "gratuito" && (
                <Alert className="bg-green-50 border-green-200">
                  <Star className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Parabéns! Você tem acesso gratuito permanente ao sistema.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura ativa</h3>
              <p className="text-gray-600 mb-4">Você precisa de uma assinatura para usar o sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planos Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plano Mensal */}
        <Card className="relative border-2 border-green-500 bg-green-50">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-green-600 text-white text-sm px-3 py-1">🎉 DESCONTO ESPECIAL</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Plano Mensal
            </CardTitle>
            <CardDescription>Flexibilidade para crescer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-lg text-gray-400 line-through">De R$ 199,00/mês</div>
                <div className="text-4xl font-bold text-green-600">R$ 99,90</div>
                <div className="text-sm text-gray-600">Por mês</div>
                <div className="text-sm font-semibold text-green-600 mt-1">Economize 50%</div>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Acesso a todas as funcionalidades
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Número ilimitado de clientes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Suporte prioritário
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Plano Anual */}
        <Card className="relative border-2 border-yellow-500 bg-yellow-50">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-yellow-600 text-white text-sm px-3 py-1">🎉 SUPER DESCONTO!</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              Plano Anual
            </CardTitle>
            <CardDescription>Melhor custo-benefício</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-lg text-gray-400 line-through">De R$ 1.318,80/ano</div>
                <div className="text-4xl font-bold text-yellow-600">R$ 599,90</div>
                <div className="text-sm text-gray-600">Pagamento anual</div>
                <div className="text-sm text-gray-600 mt-1">R$ 49,99/mês</div>
                <div className="text-sm font-semibold text-yellow-600">Economize 55%</div>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Acesso a todas as funcionalidades
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Número ilimitado de clientes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Suporte prioritário
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Preço fixo garantido por 12 meses
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {assinaturaInfo?.hasSubscription ? (
              <>
                {assinaturaInfo.expired ? (
                  <Button onClick={handleSubscribe} size="lg" className="flex-1 max-w-xs">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Reativar Assinatura
                  </Button>
                ) : assinaturaInfo.plan === "trial" ? (
                  <Button onClick={handleSubscribe} size="lg" className="flex-1 max-w-xs">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Assinar Plano
                  </Button>
                ) : assinaturaInfo.plan !== "gratuito" ? (
                  <Button
                    onClick={handleChangeplan}
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-xs bg-transparent"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Alterar Plano
                  </Button>
                ) : null}
              </>
            ) : (
              <Button onClick={handleSubscribe} size="lg" className="flex-1 max-w-xs">
                <CreditCard className="w-4 h-4 mr-2" />
                Escolher Plano
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






