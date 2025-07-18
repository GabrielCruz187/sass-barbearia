"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react"

interface CadastroFormProps {
  barbeariaId: string
  corPrimaria?: string
  corSecundaria?: string
}

export function CadastroForm({ barbeariaId, corPrimaria = "#333333", corSecundaria = "#666666" }: CadastroFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (formData.senha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          barbeariaId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao criar conta")
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login e começar a jogar.",
      })

      // Limpar formulário
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        senha: "",
        confirmarSenha: "",
      })

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome completo
            </Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
            <Input
              id="telefone"
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Senha
            </Label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirmar senha
            </Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                required
                placeholder="Digite a senha novamente"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            style={{
              background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
            }}
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <a href="/login" className="font-medium hover:underline" style={{ color: corPrimaria }}>
                Fazer login
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
