"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CheckoutFormProps {
  barbeariaId: string
}

export function CheckoutForm({ barbeariaId }: CheckoutFormProps) {
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

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        // O clientSecret já foi definido quando o elemento foi criado
        undefined,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // Você pode adicionar mais detalhes de cobrança aqui se necessário
            },
          },
        },
      )

      if (error) {
        throw new Error(error.message || "Erro ao processar pagamento")
      }

      if (paymentIntent.status === "succeeded") {
        // Atualizar o status da assinatura no backend
        await fetch("/api/confirm-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barbeariaId }),
        })

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

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Dados do Cartão</label>
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

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? "Processando..." : "Pagar R$49,90"}
      </Button>

      <p className="text-xs text-center mt-4 text-gray-500">
        Você será cobrado mensalmente. Cancele a qualquer momento.
      </p>
    </form>
  )
}
