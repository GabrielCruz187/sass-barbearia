"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StripeCheckoutFormProps {
  barbeariaId: string
  plan: "monthly" | "annual"
}

export function StripeCheckoutForm({ barbeariaId, plan }: StripeCheckoutFormProps) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error("Elemento de cartão não encontrado")
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(undefined, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // Você pode adicionar mais detalhes de cobrança aqui se necessário
          },
        },
      })

      if (paymentError) {
        throw new Error(paymentError.message || "Erro ao processar pagamento")
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Atualizar o status da assinatura no backend
        const response = await fetch("/api/confirm-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barbeariaId, plan }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao confirmar assinatura")
        }

        // Redirecionar para a página de sucesso
        router.push(`/checkout?success=true`)
      }
    } catch (err) {
      console.error("Erro no pagamento:", err)
      setError(err instanceof Error ? err.message : "Erro ao processar pagamento")

      toast({
        title: "Erro no pagamento",
        description: err instanceof Error ? err.message : "Erro ao processar pagamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/checkout?barbeariaId=${barbeariaId}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-medium mb-4">Dados do Pagamento</h3>

      <div className="mb-6">
        <div className="p-3 border rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-800" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
          Voltar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || loading}
          style={{ backgroundColor: "var(--cor-primaria)" }}
        >
          {loading ? "Processando..." : `Pagar ${plan === "monthly" ? "R$199,00" : "R$1.800,00"}`}
        </Button>
      </div>

      <p className="text-xs text-center mt-4 text-gray-500">
        Pagamento seguro processado pelo Stripe. Seus dados de cartão não são armazenados em nossos servidores.
      </p>
    </form>
  )
}
