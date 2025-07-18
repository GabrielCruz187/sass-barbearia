"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Eye, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CustomPageManagerProps {
  barbeariaId: string
  slug: string
  paginaPersonalizada: boolean
  onToggle: (enabled: boolean) => void
}

export function CustomPageManager({ barbeariaId, slug, paginaPersonalizada, onToggle }: CustomPageManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const customUrl = `${window.location.origin}/cadastro/${slug}`

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/barbearias/toggle-custom-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      })

      if (!response.ok) {
        throw new Error("Erro ao alterar configuração")
      }

      onToggle(enabled)

      toast({
        title: enabled ? "Página personalizada ativada!" : "Página personalizada desativada!",
        description: enabled
          ? "Agora você tem uma página de cadastro exclusiva para sua barbearia."
          : "A página personalizada foi desativada.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(customUrl)
      toast({
        title: "Link copiado!",
        description: "O link da sua página personalizada foi copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente selecionar e copiar manualmente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Página de Cadastro Personalizada
        </CardTitle>
        <CardDescription>
          Crie uma página de cadastro exclusiva para sua barbearia com suas cores e logo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pagina-personalizada" className="text-base font-medium">
              Ativar página personalizada
            </Label>
            <p className="text-sm text-muted-foreground">
              Permite que clientes se cadastrem diretamente na sua barbearia
            </p>
          </div>
          <Switch
            id="pagina-personalizada"
            checked={paginaPersonalizada}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {paginaPersonalizada && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sua URL personalizada</Label>
              <div className="flex gap-2">
                <Input value={customUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open(customUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                <strong>Como usar:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Compartilhe este link no Instagram, WhatsApp ou redes sociais</li>
                  <li>• Seus clientes se cadastrarão diretamente na sua barbearia</li>
                  <li>• A página terá suas cores e logo personalizadas</li>
                  <li>• Não aparecerão outras barbearias na lista</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Comparação visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-600">✅ Página Personalizada</Label>
                <div className="border rounded-lg p-3 bg-green-50">
                  <div className="text-xs text-gray-600 mb-2">cadastro/{slug}</div>
                  <div className="space-y-1">
                    <div className="h-3 bg-green-200 rounded w-3/4"></div>
                    <div className="h-2 bg-green-100 rounded w-1/2"></div>
                    <div className="text-xs text-green-700">Só sua barbearia</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">📋 Página Geral</Label>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-2">cadastro</div>
                  <div className="space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="text-xs text-gray-700">Lista todas as barbearias</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



