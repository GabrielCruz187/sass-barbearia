"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { CustomPageManager } from "@/components/custom-page-manager"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, ImageIcon, Copy, ExternalLink, Palette, Settings, User, LinkIcon } from "lucide-react"

interface BarbeariaConfig {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  endereco: string
  logoUrl: string | null
  slug: string
  corPrimaria: string
  corSecundaria: string
  mensagemMarketing: string
  paginaPersonalizada: boolean
  limiteJogosMes: number
  diasValidade: number
}

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<BarbeariaConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/barbearias/configuracoes")
      if (!response.ok) {
        throw new Error("Erro ao carregar configurações")
      }
      const data = await response.json()
      setConfig(data)
      setLogoPreview(data.logoUrl)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        })
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        })
        return
      }

      setLogoFile(file)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(config?.logoUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    setIsSaving(true)
    try {
      const formData = new FormData()

      // Adicionar dados básicos
      formData.append("nome", config.nome)
      formData.append("telefone", config.telefone)
      formData.append("whatsapp", config.whatsapp)
      formData.append("endereco", config.endereco)
      formData.append("corPrimaria", config.corPrimaria)
      formData.append("corSecundaria", config.corSecundaria)
      formData.append("mensagemMarketing", config.mensagemMarketing)
      formData.append("limiteJogosMes", config.limiteJogosMes.toString())
      formData.append("diasValidade", config.diasValidade.toString())

      // Adicionar logo se foi selecionado
      if (logoFile) {
        formData.append("logo", logoFile)
      }

      const response = await fetch("/api/barbearias/configuracoes", {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar configurações")
      }

      // Atualizar o config com a nova URL do logo se foi feito upload
      if (logoFile) {
        setConfig((prev) => (prev ? { ...prev, logoUrl: logoPreview } : null))
        setLogoFile(null)
      }

      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Erro ao carregar configurações</h1>
          <Button onClick={fetchConfig} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const cadastroUrl = `${window.location.origin}/cadastro/${config.slug}`

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações da sua barbearia</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Página Personalizada */}
        <CustomPageManager
          barbeariaId={config.id}
          slug={config.slug}
          paginaPersonalizada={config.paginaPersonalizada}
          onToggle={(enabled) => setConfig({ ...config, paginaPersonalizada: enabled })}
        />

        {/* Link de Cadastro Personalizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Link de Cadastro Personalizado
            </CardTitle>
            <CardDescription>
              Compartilhe este link para que seus clientes se cadastrem diretamente na sua barbearia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL de Cadastro</Label>
              <div className="flex gap-2">
                <Input value={cadastroUrl} readOnly className="font-mono text-sm" />
                <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(cadastroUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => window.open(cadastroUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações da Barbearia
            </CardTitle>
            <CardDescription>Informações básicas e logo da sua barbearia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload de Logo */}
            <div className="space-y-4">
              <Label>Logo da Barbearia</Label>

              {logoPreview ? (
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo da barbearia"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Logo atual. Clique no X para remover ou selecione uma nova imagem para substituir.
                    </p>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Alterar Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Clique para fazer upload do logo</p>
                  <p className="text-sm text-gray-500">PNG, JPG ou WEBP até 5MB</p>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Barbearia</Label>
                <Input
                  id="nome"
                  value={config.nome}
                  onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={config.email} disabled className="mt-1 bg-gray-50" />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={config.telefone}
                  onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                  className="mt-1"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={config.whatsapp}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  className="mt-1"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={config.endereco}
                onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                className="mt-1"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div>
              <Label>Slug da URL</Label>
              <div className="flex mt-1">
                <Input value={config.slug} disabled className="flex-1 bg-gray-50" />
                <Button type="button" variant="outline" onClick={() => copyToClipboard(config.slug)} className="ml-2">
                  Copiar
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Este é o identificador único da sua barbearia na URL</p>
            </div>
          </CardContent>
        </Card>

        {/* Personalização Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalização Visual
            </CardTitle>
            <CardDescription>Customize as cores e mensagens da sua barbearia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="corPrimaria">Cor Primária</Label>
                <div className="flex mt-1">
                  <Input
                    id="corPrimaria"
                    type="color"
                    value={config.corPrimaria}
                    onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={config.corPrimaria}
                    onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                    className="ml-2 flex-1"
                    placeholder="#333333"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="corSecundaria">Cor Secundária</Label>
                <div className="flex mt-1">
                  <Input
                    id="corSecundaria"
                    type="color"
                    value={config.corSecundaria}
                    onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={config.corSecundaria}
                    onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })}
                    className="ml-2 flex-1"
                    placeholder="#666666"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="mensagemMarketing">Mensagem de Marketing</Label>
              <Textarea
                id="mensagemMarketing"
                value={config.mensagemMarketing}
                onChange={(e) => setConfig({ ...config, mensagemMarketing: e.target.value })}
                placeholder="Digite uma mensagem promocional para seus clientes..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Preview das cores */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="p-6 rounded-lg text-white text-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                }}
              >
                {logoPreview && (
                  <img
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo"
                    className="w-16 h-16 object-cover rounded-full mx-auto mb-4 border-2 border-white/20"
                  />
                )}
                <h3 className="font-bold text-xl mb-2">{config.nome}</h3>
                <p className="text-sm opacity-90">
                  {config.mensagemMarketing || "Crie sua conta e participe da nossa roleta de prêmios!"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Jogo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Jogo
            </CardTitle>
            <CardDescription>Configure as regras do sistema de gamificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="limiteJogosMes">Limite de Jogos por Mês</Label>
                <Input
                  id="limiteJogosMes"
                  type="number"
                  min="1"
                  max="30"
                  value={config.limiteJogosMes}
                  onChange={(e) => setConfig({ ...config, limiteJogosMes: Number.parseInt(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Quantos jogos cada cliente pode fazer por mês</p>
              </div>

              <div>
                <Label htmlFor="diasValidade">Dias de Validade do Prêmio</Label>
                <Input
                  id="diasValidade"
                  type="number"
                  min="1"
                  max="365"
                  value={config.diasValidade}
                  onChange={(e) => setConfig({ ...config, diasValidade: Number.parseInt(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Por quantos dias o prêmio fica válido após ser ganho</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  )
}



