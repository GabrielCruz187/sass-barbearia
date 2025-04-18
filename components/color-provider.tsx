"use client"

import type React from "react"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

interface ColorProviderProps {
  children: React.ReactNode
}

export function ColorProvider({ children }: ColorProviderProps) {
  const { data: session, status } = useSession()

  useEffect(() => {
    const fetchBarbeariaColors = async () => {
      if (status === "authenticated" && session?.user?.barbeariaId) {
        try {
          const response = await fetch(`/api/public/barbearias/${session.user.barbeariaId}`)
          if (response.ok) {
            const data = await response.json()

            // Aplicar cores personalizadas
            document.documentElement.style.setProperty("--cor-primaria", data.corPrimaria || "#333333")
            document.documentElement.style.setProperty("--cor-secundaria", data.corSecundaria || "#666666")

            console.log("Cores aplicadas:", data.corPrimaria, data.corSecundaria)
          }
        } catch (error) {
          console.error("Erro ao buscar cores da barbearia:", error)

          // Cores padrão em caso de erro
          document.documentElement.style.setProperty("--cor-primaria", "#333333")
          document.documentElement.style.setProperty("--cor-secundaria", "#666666")
        }
      } else if (status === "unauthenticated") {
        // Cores padrão para usuários não autenticados
        document.documentElement.style.setProperty("--cor-primaria", "#333333")
        document.documentElement.style.setProperty("--cor-secundaria", "#666666")
      }
    }

    fetchBarbeariaColors()
  }, [session, status])

  return <>{children}</>
}
