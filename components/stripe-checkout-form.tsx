"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface StripeCheckoutFormProps {
  barbeariaId: string
  plan: "monthly" | "annual"
  clientSecret: string
  isChangingPlan?: boolean
}

export function StripeCheckoutForm({
  barbeariaId,
  plan,
  clientSecret,
  isChangingPlan = false,
}: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js ainda não carregou
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()

      if (submitError) {
        setError(submitError.message || "Ocorreu um erro ao processar o pagamento")
        setIsProcessing(false)
        return
      }

      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?success=true`,
        },
      })

      if (paymentError) {
        setError(paymentError.message || "Ocorreu um erro ao processar o pagamento")
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      setError("Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    router.push(`/checkout?canceled=true&barbeariaId=${barbeariaId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-800" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isProcessing} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="flex-1"
          style={{ backgroundColor: "var(--cor-primaria)" }}
        >
          {isProcessing ? "Processando..." : isChangingPlan ? "Confirmar Mudança" : "Pagar Agora"}
        </Button>
      </div>
    </form>
  )
}



