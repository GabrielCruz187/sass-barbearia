"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Scissors, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ClienteLayoutProps {
  children: React.ReactNode
}

export function ClienteLayout({ children }: ClienteLayoutProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [barbeariaInfo, setBarbeariaInfo] = useState({
    nome: "",
    logoUrl: "",
    corPrimaria: "#9333ea",
    corSecundaria: "#ec4899",
  })

  useEffect(() => {
    console.log("ClienteLayout - session:", session)
    console.log("ClienteLayout - status:", status)
  }, [session, status])

  useEffect(() => {
    const fetchBarbeariaInfo = async () => {
      try {
        if (status === "loading") return

        if (!session?.user?.barbeariaId) {
          console.log("ClienteLayout - Sem sessão ou barbeariaId, não buscando informações")
          setLoading(false)
          return
        }

        console.log("ClienteLayout - Buscando informações da barbearia")
        const response = await fetch(`/api/public/barbearias/${session.user.barbeariaId}`)
        if (response.ok) {
          const data = await response.json()
          setBarbeariaInfo({
            nome: data.nome,
            logoUrl: data.logoUrl,
            corPrimaria: data.corPrimaria,
            corSecundaria: data.corSecundaria,
          })

          // Aplicar cores personalizadas
          document.documentElement.style.setProperty("--cor-primaria", data.corPrimaria)
          document.documentElement.style.setProperty("--cor-secundaria", data.corSecundaria)
        }
      } catch (error) {
        console.error("Erro ao buscar informações da barbearia:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBarbeariaInfo()
  }, [session, status])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  // Mostrar um estado de carregamento enquanto verificamos a sessão
  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom, ${barbeariaInfo.corPrimaria}, ${barbeariaInfo.corSecundaria})`,
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não houver sessão, não renderizar o layout
  if (status === "unauthenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom, ${barbeariaInfo.corPrimaria}, ${barbeariaInfo.corSecundaria})`,
        }}
      >
        <div className="text-center">
          <p className="text-white mb-4">Você precisa estar autenticado para acessar esta página</p>
          <Button asChild variant="outline" className="border-white text-white hover:bg-white/20">
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  const gradientStyle = {
    background: `linear-gradient(to bottom, ${barbeariaInfo.corPrimaria}, ${barbeariaInfo.corSecundaria})`,
  }

  return (
    <div className="min-h-screen flex flex-col" style={gradientStyle}>
      <header className="bg-white/10 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          {loading ? (
            <div className="h-6 w-6 rounded-full bg-white/20 animate-pulse"></div>
          ) : barbeariaInfo.logoUrl ? (
            <img
              src={barbeariaInfo.logoUrl || "/placeholder.svg"}
              alt={barbeariaInfo.nome}
              className="h-6 w-6 rounded-full object-cover mr-2"
            />
          ) : (
            <Scissors className="h-6 w-6 text-white mr-2" />
          )}
          <h1 className="text-xl font-bold text-white">
            {loading ? (
              <div className="h-6 w-32 bg-white/20 animate-pulse rounded"></div>
            ) : (
              barbeariaInfo.nome || "Barbearia"
            )}
          </h1>
        </div>
        <Button variant="outline" className="border-white text-white hover:bg-white/20" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">{children}</main>
    </div>
  )
}
