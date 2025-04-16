"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Printer, Share2, Gift } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { GameSlot } from "@/components/game-slot"
import { PremioTicket } from "@/components/premio-ticket"
import { realizarJogo } from "@/lib/actions/jogo-actions"
import { differenceInSeconds } from "date-fns"

interface Premio {
  titulo: string
  descricao: string
  codigo: string
}

interface Barbearia {
  nome: string
  whatsapp: string
  mensagemMarketing: string
  logoUrl: string | null
}

interface Jogo {
  id: string
  premio: Premio
  barbearia: Barbearia
  dataExpiracao: string
}

export default function JogoPage() {
  const { toast } = useToast()
  const [isSpinning, setIsSpinning] = useState(false)
  const [jogoAtual, setJogoAtual] = useState<Jogo | null>(null)
  const [showTicket, setShowTicket] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [temJogoAtivo, setTemJogoAtivo] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já tem um jogo ativo
    const verificarJogoAtivo = async () => {
      try {
        // Simular uma chamada para verificar jogo ativo
        // Em produção, isso seria uma chamada real para a API
        const result = await realizarJogo()

        if (result.jogoExistente) {
          // Se já existe um jogo ativo, armazenar os dados mas não mostrar o ticket automaticamente
          setJogoAtual({
            id: result.jogoExistente.id,
            premio: {
              titulo: "Prêmio Ativo",
              descricao: "Você já tem um prêmio ativo",
              codigo: "ATIVO",
            },
            barbearia: {
              nome: "Barbearia",
              whatsapp: "",
              mensagemMarketing: "",
              logoUrl: null,
            },
            dataExpiracao: result.jogoExistente.dataExpiracao,
          })

          // Indicar que há um jogo ativo, mas não mostrar o ticket automaticamente
          setTemJogoAtivo(true)

          // Calcular countdown
          const segundosRestantes = differenceInSeconds(new Date(result.jogoExistente.dataExpiracao), new Date())
          setCountdown(Math.max(0, segundosRestantes))
        }
      } catch (error) {
        console.error("Erro ao verificar jogo ativo:", error)
      } finally {
        setLoading(false)
      }
    }

    verificarJogoAtivo()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (jogoAtual && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [jogoAtual, countdown])

  const formatCountdown = () => {
    const days = Math.floor(countdown / (24 * 60 * 60))
    const hours = Math.floor((countdown % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((countdown % (60 * 60)) / 60)
    const seconds = countdown % 60
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  const handleSpin = async () => {
    if (isSpinning) return
    setIsSpinning(true)
    setError("")

    try {
      // Simular o tempo de giro
      setTimeout(async () => {
        const result = await realizarJogo()

        if (result.error) {
          setError(result.error)
          setIsSpinning(false)
          return
        }

        if (result.success) {
          setJogoAtual(result.jogo)

          // Calcular countdown
          const segundosRestantes = differenceInSeconds(new Date(result.jogo.dataExpiracao), new Date())
          setCountdown(Math.max(0, segundosRestantes))

          setShowTicket(true)
        } else if (result.jogoExistente) {
          // Se já existe um jogo, mostrar o ticket
          setShowTicket(true)
        }

        setIsSpinning(false)
      }, 3000)
    } catch (error) {
      console.error("Erro ao realizar jogo:", error)
      setError("Ocorreu um erro ao realizar o jogo. Tente novamente.")
      setIsSpinning(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: "Seu bilhete está sendo baixado como PDF",
    })
  }

  const handleShare = () => {
    if (navigator.share && jogoAtual) {
      navigator
        .share({
          title: `Meu prêmio: ${jogoAtual.premio.titulo}`,
          text: `Ganhei um prêmio na ${jogoAtual.barbearia.nome}: ${jogoAtual.premio.titulo} (${jogoAtual.premio.codigo})`,
        })
        .catch((error) => {
          console.log("Erro ao compartilhar", error)
        })
    } else {
      toast({
        title: "Compartilhar",
        description: "Função de compartilhamento não suportada pelo seu navegador",
      })
    }
  }

  const handleViewTicket = () => {
    setShowTicket(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {!showTicket ? (
        <motion.div
          key="game"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-32 h-32 mb-6 relative">
                <Image
                  src="/placeholder.svg?height=128&width=128"
                  alt="Logo da Barbearia"
                  width={128}
                  height={128}
                  className="rounded-full object-cover"
                />
              </div>

              <h2 className="text-2xl font-bold text-center mb-2">Jogue e Ganhe!</h2>
              <p className="text-center text-muted-foreground mb-6">
                Clique no botão abaixo para receber seu prêmio exclusivo
              </p>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm w-full">{error}</div>}

              <GameSlot isSpinning={isSpinning} />

              {temJogoAtivo ? (
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-amber-600 font-medium mb-3">Você já tem um prêmio ativo! Deseja visualizá-lo?</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleViewTicket}
                      variant="outline"
                      className="flex items-center gap-2"
                      style={{ borderColor: "var(--cor-primaria)", color: "var(--cor-primaria)" }}
                    >
                      <Gift className="h-4 w-4" />
                      Ver Meu Prêmio
                    </Button>
                    <Button
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                      style={{ backgroundColor: "var(--cor-primaria)", color: "white" }}
                    >
                      {isSpinning ? "Girando..." : "Tentar Novamente"}
                    </Button>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground text-center">
                    Você pode jogar 1 vez por mês. Prêmios válidos por 30 dias.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleSpin}
                    disabled={isSpinning}
                    size="lg"
                    className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                    style={{ backgroundColor: "var(--cor-primaria)", color: "white" }}
                  >
                    {isSpinning ? "Girando..." : "Receba seu Prêmio!"}
                  </Button>

                  <p className="mt-4 text-xs text-muted-foreground text-center">
                    Você pode jogar 1 vez por mês. Prêmios válidos por 30 dias.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="ticket"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div
                className="p-4 text-center text-white"
                style={{ background: `linear-gradient(to right, var(--cor-primaria), var(--cor-secundaria))` }}
              >
                <div className="mx-auto mb-2 bg-white/20 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-trophy"
                  >
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Parabéns!</h2>
                <p>Você ganhou um prêmio especial</p>
              </div>

              <div className="p-6">
                {jogoAtual && (
                  <PremioTicket
                    nomeBarbearia={jogoAtual.barbearia.nome}
                    tituloPremio={jogoAtual.premio.titulo}
                    descricaoPremio={jogoAtual.premio.descricao}
                    codigoPremio={jogoAtual.premio.codigo}
                    dataValidade={new Date(jogoAtual.dataExpiracao)}
                    telefone={jogoAtual.barbearia.whatsapp.replace(/\D/g, "")}
                    mensagemMarketing={jogoAtual.barbearia.mensagemMarketing}
                  />
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm font-medium mb-2">Válido por:</p>
                  <div className="bg-gray-100 rounded-lg p-3 font-mono text-lg font-bold">{formatCountdown()}</div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Salvar PDF
                  </Button>
                  <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <Button onClick={() => setShowTicket(false)} variant="ghost">
                    Voltar ao jogo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
