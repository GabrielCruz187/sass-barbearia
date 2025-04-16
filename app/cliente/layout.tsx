import type React from "react"
import { ClienteLayout } from "@/components/layout/cliente-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ClienteLayout>{children}</ClienteLayout>
}
