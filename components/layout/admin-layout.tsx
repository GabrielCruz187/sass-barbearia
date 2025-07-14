"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  Users,
  Gift,
  Settings,
  BarChart3,
  LogOut,
  Scissors,
  Menu,
  X,
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [barbeariaInfo, setBarbeariaInfo] = useState({
    nome: "",
    logoUrl: "",
  })

  useEffect(() => {
    console.log("AdminLayout - session:", session)
    console.log("AdminLayout - status:", status)
  }, [session, status])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Verificar o status da assinatura da barbearia
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (status === "authenticated" && session?.user?.barbeariaId) {
        setCheckingSubscription(true)
        try {
          console.log("Verificando status da assinatura...")
          const response = await fetch("/api/check-subscription-status")
          if (response.ok) {
            const data = await response.json()
            console.log("Status da assinatura:", data)
            setSubscriptionStatus(data)
          } else {
            console.error("Erro ao verificar status da assinatura")
            setSubscriptionStatus({ status: "inactive" })
          }
        } catch (error) {
          console.error("Erro ao verificar status da assinatura:", error)
          setSubscriptionStatus({ status: "inactive" })
        } finally {
          setCheckingSubscription(false)
        }
      } else {
        setCheckingSubscription(false)
      }
    }

    checkSubscriptionStatus()
  }, [session, status])

  useEffect(() => {
    const fetchBarbeariaInfo = async () => {
      try {
        if (status === "loading") return

        if (!session) {
          console.log("AdminLayout - Sem sessão, não buscando informações")
          setLoading(false)
          return
        }

        console.log("AdminLayout - Buscando informações da barbearia")
        const response = await fetch("/api/barbearias/configuracoes")
        if (response.ok) {
          const data = await response.json()
          setBarbeariaInfo({
            nome: data.nome,
            logoUrl: data.logoUrl,
          })
        }
      } catch (error) {
        console.error("Erro ao buscar informações da barbearia:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBarbeariaInfo()
  }, [session, status])

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/premios", label: "Prêmios", icon: Gift },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
    { href: "/admin/assinatura", label: "Assinatura", icon: CreditCard },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  // Mostrar um estado de carregamento enquanto verificamos a sessão
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não houver sessão, não renderizar o layout
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">Você precisa estar autenticado para acessar esta página</p>
          <Button asChild>
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Função para renderizar alertas de assinatura
  const renderSubscriptionAlert = () => {
    if (checkingSubscription || pathname === "/admin/assinatura" || pathname === "/checkout") {
      return null
    }

    if (!subscriptionStatus) {
      return (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-800" />
          <AlertDescription className="text-yellow-800">
            Status da assinatura não disponível.{" "}
            <Link href="/admin/assinatura" className="font-medium underline">
              Verificar assinatura
            </Link>
          </AlertDescription>
        </Alert>
      )
    }

    if (subscriptionStatus.status === "expired") {
      return (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-800" />
          <AlertDescription className="text-red-800">
            <span className="font-bold">⚠️ Período de teste expirado!</span> Escolha um plano para continuar usando o
            sistema.{" "}
            <Link href="/admin/assinatura" className="font-medium underline">
              Ativar assinatura
            </Link>
          </AlertDescription>
        </Alert>
      )
    }

    if (subscriptionStatus.status === "active" && subscriptionStatus.plano === "trial") {
      const diasRestantes = subscriptionStatus.diasRestantes || 0
      const isUrgent = diasRestantes <= 2

      return (
        <Alert className={`mb-4 ${isUrgent ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
          <Clock className={`h-4 w-4 ${isUrgent ? "text-red-800" : "text-yellow-800"}`} />
          <AlertDescription className={isUrgent ? "text-red-800" : "text-yellow-800"}>
            <span className="font-bold">{isUrgent ? "🚨 Urgente!" : "⏰ Período de teste:"}</span>{" "}
            {diasRestantes > 0
              ? `${diasRestantes} dia${diasRestantes > 1 ? "s" : ""} restante${diasRestantes > 1 ? "s" : ""}`
              : "Expira hoje"}
            .{" "}
            <Link href="/admin/assinatura" className="font-medium underline">
              Escolher plano
            </Link>
          </AlertDescription>
        </Alert>
      )
    }

    if (subscriptionStatus.status === "inactive") {
      return (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-800" />
          <AlertDescription className="text-yellow-800">
            Sua assinatura não está ativa. Algumas funcionalidades podem estar limitadas.{" "}
            <Link href="/admin/assinatura" className="font-medium underline">
              Ativar assinatura
            </Link>
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  const renderNavItems = () => (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant="ghost"
          className={`w-full justify-start ${pathname === item.href ? "bg-white/10" : ""}`}
          style={{ color: "white" }}
          asChild
        >
          <Link href={item.href} onClick={() => setIsOpen(false)}>
            <item.icon className="mr-2 h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  )

  const renderSidebar = () => (
    <div className="w-64 bg-gray-800 text-white p-4 hidden md:flex md:flex-col h-screen fixed">
      <div className="flex items-center gap-2 mb-8">
        {loading ? (
          <Skeleton className="h-6 w-6 rounded-full bg-white/20" />
        ) : barbeariaInfo.logoUrl ? (
          <img
            src={barbeariaInfo.logoUrl || "/placeholder.svg"}
            alt={barbeariaInfo.nome}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <Scissors className="h-6 w-6" />
        )}
        <h1 className="text-xl font-bold truncate">
          {loading ? <Skeleton className="h-6 w-32 bg-white/20" /> : barbeariaInfo.nome || "Painel Admin"}
        </h1>
      </div>

      {renderSubscriptionAlert()}

      {renderNavItems()}

      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start text-white" onClick={handleSignOut}>
          <LogOut className="mr-2 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )

  const renderMobileHeader = () => (
    <div
      className="md:hidden bg-gray-800 text-white p-4 fixed top-0 left-0 right-0 z-10 flex items-center justify-between"
      style={{ background: `var(--cor-primaria)` }}
    >
      <div className="flex items-center gap-2">
        {loading ? (
          <Skeleton className="h-6 w-6 rounded-full bg-white/20" />
        ) : barbeariaInfo.logoUrl ? (
          <img
            src={barbeariaInfo.logoUrl || "/placeholder.svg"}
            alt={barbeariaInfo.nome}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <Scissors className="h-6 w-6" />
        )}
        <h1 className="text-xl font-bold truncate max-w-[200px]">
          {loading ? <Skeleton className="h-6 w-32 bg-white/20" /> : barbeariaInfo.nome || "Painel Admin"}
        </h1>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-purple-900 text-white border-r-purple-800 p-0">
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {barbeariaInfo.logoUrl ? (
                  <img
                    src={barbeariaInfo.logoUrl || "/placeholder.svg"}
                    alt={barbeariaInfo.nome}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <Scissors className="h-6 w-6" />
                )}
                <h1 className="text-xl font-bold truncate">{barbeariaInfo.nome || "Painel Admin"}</h1>
              </div>
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setIsOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            {renderSubscriptionAlert()}

            {renderNavItems()}

            <div className="mt-auto">
              <Button variant="ghost" className="w-full justify-start text-white" onClick={handleSignOut}>
                <LogOut className="mr-2 h-5 w-5" />
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {renderSidebar()}
      {renderMobileHeader()}

      <div className="flex-1 p-6 md:p-8 bg-gray-50 md:ml-64 md:mt-0 mt-16">
        {renderSubscriptionAlert()}
        {children}
      </div>
    </div>
  )
}



