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
  title: "Prêmio Barbershop - Jogue e Ganhe",
  description: "Sistema de premiação para barbearias",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
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
