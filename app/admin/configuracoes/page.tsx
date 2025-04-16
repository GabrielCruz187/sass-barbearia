"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { atualizarConfiguracoes } from "@/lib/actions/configuracao-actions"

interface ConfiguracoesBarbearia {
  nome: string
  email: string
  telefone: string
  whatsapp: string
  endereco: string
  logoUrl: string | null
  mensagemMarketing: string
  corPrimaria: string
  corSecundaria: string
  limiteJogosMes: number
  diasValidade: number
}

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesBarbearia | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  const fetchConfiguracoes = async () => {
    try {
      const response = await fetch("/api/barbearias/configuracoes")
      if (!response.ok) {
        throw new Error("Falha ao carregar configurações")
      }
      const data = await response.json()
      setConfiguracoes(data)
      setLogoPreview(data.logoUrl)
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await atualizarConfiguracoes(new FormData(e.currentTarget))

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      fetchConfiguracoes()
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center p-6">Carregando configurações...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Barbearia</CardTitle>
              <CardDescription>Atualize as informações da sua barbearia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Barbearia</Label>
                  <Input id="nome" name="nome" defaultValue={configuracoes?.nome || ""} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" defaultValue={configuracoes?.telefone || ""} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp (para contato dos clientes)</Label>
                  <Input id="whatsapp" name="whatsapp" defaultValue={configuracoes?.whatsapp || ""} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" name="endereco" defaultValue={configuracoes?.endereco || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mensagemMarketing">Mensagem de Marketing</Label>
                  <Textarea
                    id="mensagemMarketing"
                    name="mensagemMarketing"
                    defaultValue={
                      configuracoes?.mensagemMarketing ||
                      "Obrigado por jogar! Venha nos visitar e aproveite seu prêmio."
                    }
                    placeholder="Mensagem que aparecerá no ticket do prêmio"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
              <CardDescription>Personalize a aparência do jogo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="corPrimaria">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="corPrimaria"
                      name="corPrimaria"
                      type="color"
                      defaultValue={configuracoes?.corPrimaria || "#9333ea"}
                      className="w-16 h-10"
                    />
                    <Input defaultValue={configuracoes?.corPrimaria || "#9333ea"} className="flex-1" readOnly />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="corSecundaria">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="corSecundaria"
                      name="corSecundaria"
                      type="color"
                      defaultValue={configuracoes?.corSecundaria || "#ec4899"}
                      className="w-16 h-10"
                    />
                    <Input defaultValue={configuracoes?.corSecundaria || "#ec4899"} className="flex-1" readOnly />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logo">Logo da Barbearia</Label>
                  <div className="flex flex-col gap-4">
                    {logoPreview && (
                      <div className="w-32 h-32 relative rounded-lg overflow-hidden border">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      ref={fileInputRef}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do Jogo</CardTitle>
              <CardDescription>Configure as regras do jogo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="limiteJogosMes">Limite de Jogos por Mês (por cliente)</Label>
                  <Input
                    id="limiteJogosMes"
                    name="limiteJogosMes"
                    type="number"
                    min="1"
                    defaultValue={configuracoes?.limiteJogosMes || 1}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="diasValidade">Dias de Validade do Prêmio</Label>
                  <Input
                    id="diasValidade"
                    name="diasValidade"
                    type="number"
                    min="1"
                    default
                    type="number"
                    min="1"
                    defaultValue={configuracoes?.diasValidade || 30}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
