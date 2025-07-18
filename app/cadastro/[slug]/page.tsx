"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Check, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cadastrarCliente } from "@/lib/actions/auth-actions"
import { buscarBarbeariaPorSlug } from "@/lib/actions/barbearia-actions"

interface Barbearia {
  id: string
  nome: string
  endereco?: string
  logoUrl?: string
  slug: string
  corPrimaria: string
  corSecundaria: string
  mensagemMarketing?: string
}

export default function CadastroPersonalizadoPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [loadingBarbearia, setLoadingBarbearia] = useState(true)
  const [isAssinante, setIsAssinante] = useState(false)

  // Estados para validação de email
  const [clientEmail, setClientEmail] = useState("")
  const [validatingEmail, setValidatingEmail] = useState(false)
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const [emailMessage, setEmailMessage] = useState("")
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar dados da barbearia
  useEffect(() => {
    const fetchBarbearia = async () => {
      setLoadingBarbearia(true)
      try {
        const result = await buscarBarbeariaPorSlug(slug)

        if (result.success && result.data) {
          setBarbearia(result.data)
        } else {
          setError(result.error || "Barbearia não encontrada")
        }
      } catch (error) {
        console.error("Erro ao carregar barbearia:", error)
        setError("Erro ao carregar dados da barbearia")
      } finally {
        setLoadingBarbearia(false)
      }
    }

    if (slug) {
      fetchBarbearia()
    }
  }, [slug])

  // Função para validar email
  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailValid(null)
      setEmailMessage("")
      return
    }

    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current)
    }

    emailTimeoutRef.current = setTimeout(async () => {
      setValidatingEmail(true)
      setEmailValid(null)
      setEmailMessage("")

      try {
        const response = await fetch("/api/cadastro/validar-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (data.valid) {
          setEmailValid(true)
          setEmailMessage("Email válido!")
        } else {
          setEmailValid(false)
          setEmailMessage(data.error || "Email inválido ou inexistente.")
        }
      } catch (error) {
        console.error("Erro ao validar email:", error)
        setEmailValid(false)
        setEmailMessage("Erro ao validar email. Tente novamente.")
      } finally {
        setValidatingEmail(false)
      }
    }, 800)
  }

  useEffect(() => {
    validateEmail(clientEmail)
  }, [clientEmail])

  const handleClientRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (emailValid !== true) {
      setError("Por favor, use um email válido e existente.")
      setLoading(false)
      return
    }

    if (!barbearia) {
      setError("Dados da barbearia não encontrados")
      setLoading(false)
      return
    }

    try {
      const formData = new FormData(e.currentTarget)
      formData.set("barbeariaId", barbearia.id)
      formData.set("assinante", isAssinante.toString())

      const result = await cadastrarCliente(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result?.success && result?.redirectTo) {
        router.push(result.redirectTo)
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error)
      setError(`Ocorreu um erro ao realizar o cadastro: ${error instanceof Error ? error.message : String(error)}`)
      setLoading(false)
    }
  }

  const renderEmailValidation = () => {
    if (validatingEmail) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }

    if (emailValid === true) {
      return <Check className="h-4 w-4 text-green-500" />
    }

    if (emailValid === false) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }

    return null
  }

  if (loadingBarbearia) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-800 via-gray-600 to-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!barbearia) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-800 via-gray-600 to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Barbearia não encontrada</h2>
              <p className="text-gray-600 mb-4">
                A barbearia que você está procurando não foi encontrada ou não está mais ativa.
              </p>
              <Link href="/cadastro">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao cadastro geral
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Aplicar cores personalizadas da barbearia
  const customStyle = {
    "--primary-color": barbearia.corPrimaria,
    "--secondary-color": barbearia.corSecundaria,
  } as React.CSSProperties

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: `linear-gradient(to bottom, ${barbearia.corPrimaria}, ${barbearia.corSecundaria}, #1f2937)`,
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            {barbearia.logoUrl ? (
              <img
                src={barbearia.logoUrl || "/placeholder.svg"}
                alt={`Logo ${barbearia.nome}`}
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: barbearia.corPrimaria }}
              >
                {barbearia.nome.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <CardTitle className="text-2xl text-center">Cadastre-se</CardTitle>
          <CardDescription className="text-center">
            {barbearia.mensagemMarketing ||
              `Crie sua conta na ${barbearia.nome} e participe da nossa roleta de prêmios!`}
          </CardDescription>
          {barbearia.endereco && <p className="text-sm text-center text-gray-600">{barbearia.endereco}</p>}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleClientRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome Completo</Label>
              <Input id="client-name" name="nome" type="text" placeholder="Seu nome completo" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <div className="relative">
                <Input
                  id="client-email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className={`pr-10 ${emailValid === false ? "border-red-500 focus-visible:ring-red-500" : emailValid === true ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">{renderEmailValidation()}</div>
              </div>
              {emailMessage && (
                <p className={`text-xs mt-1 ${emailValid ? "text-green-600" : "text-red-600"}`}>{emailMessage}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefone (WhatsApp)</Label>
              <Input id="client-phone" name="telefone" type="tel" placeholder="(00) 00000-0000" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-password">Senha</Label>
              <Input id="client-password" name="senha" type="password" required />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="assinante"
                checked={isAssinante}
                onCheckedChange={(checked) => setIsAssinante(checked as boolean)}
              />
              <Label
                htmlFor="assinante"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Sou assinante desta barbearia
              </Label>
            </div>

            {isAssinante && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  Como assinante, você terá acesso a prêmios exclusivos na roleta especial!
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: barbearia.corPrimaria }}
              disabled={loading || emailValid !== true}
            >
              {loading ? "Cadastrando..." : "Cadastrar e Jogar"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="hover:underline" style={{ color: barbearia.corPrimaria }}>
              Faça login
            </Link>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            <Link href="/cadastro" className="hover:underline">
              Cadastrar em outra barbearia
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

