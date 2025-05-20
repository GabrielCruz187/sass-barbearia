import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/components/session-provider"
import { ColorProvider } from "@/components/color-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BarberSpin - Jogue e Ganhe",
  description: "Sistema de premiação para barbearias",
  // Mantendo a configuração do favicon no metadata
  icons: {
    icon: "/logo.webp", // Caminho para o logo dentro da pasta public
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Definindo o favicon diretamente no <head> */}
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ColorProvider>
              {children}
              <Toaster />
            </ColorProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}