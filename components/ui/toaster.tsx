"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast, index) => (
        <Toast key={index} variant={toast.variant}>
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
