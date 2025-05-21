"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PremioTicketProps {
  nomeBarbearia: string
  tituloPremio: string
  descricaoPremio: string
  codigoPremio: string
  dataValidade: Date
  telefone: string
  mensagemMarketing?: string
}

export function PremioTicket({
  nomeBarbearia,
  tituloPremio,
  descricaoPremio,
  codigoPremio,
  dataValidade,
  telefone,
  mensagemMarketing = "Apresente este cupom na barbearia para resgatar seu prêmio.",
}: PremioTicketProps) {
  const qrCodeRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (qrCodeRef.current) {
      // Gerar link do WhatsApp
      const whatsappLink = `https://wa.me/${telefone}?text=Olá! Vim resgatar meu prêmio: ${tituloPremio} (código: ${codigoPremio})`

      // Gerar QR Code
      QRCode.toCanvas(qrCodeRef.current, whatsappLink, {
        width: 120,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }).catch((err) => {
        console.error("Erro ao gerar QR code:", err)
      })
    }
  }, [tituloPremio, codigoPremio, telefone])

  // Criar o link do WhatsApp para o botão
  const whatsappLink = `https://wa.me/${telefone}?text=Olá! Vim resgatar meu prêmio: ${tituloPremio} (código: ${codigoPremio})`

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 premio-ticket">
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-bold text-center mb-2">{nomeBarbearia}</h3>

        <div className="w-full border-t border-gray-200 my-2" />

        <div className="flex flex-col md:flex-row items-center justify-between w-full">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h4 className="text-2xl font-bold" style={{ color: "var(--cor-primaria)" }}>
              {tituloPremio}
            </h4>
            <p className="text-sm text-gray-600">{descricaoPremio}</p>
            <p className="mt-2 font-mono bg-gray-100 p-1 rounded text-sm">{codigoPremio}</p>
            <p className="text-xs mt-2">
              Válido até: {format(dataValidade, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <canvas ref={qrCodeRef} className="mb-1" />
            <p className="text-xs text-center text-gray-500">Escaneie para resgatar</p>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-message-circle"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              Abrir WhatsApp
            </a>
          </div>
        </div>

        <div className="w-full border-t border-gray-200 my-2" />

        <p className="text-xs text-center text-gray-500">{mensagemMarketing}</p>
      </div>
    </div>
  )
}
