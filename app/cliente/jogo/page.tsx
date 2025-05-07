"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Printer, Share2, Gift, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { GameWheel } from "@/components/game-wheel"
import { PremioTicket } from "@/components/premio-ticket"
import { realizarJogo, verificarJogoAtivo, buscarPremiosBarbearia } from "@/lib/actions/jogo-actions"
import { differenceInSeconds } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Premio {
  id: string
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
  const [semPremios, setSemPremios] = useState(false)
  const [verificado, setVerificado] = useState(false)
  const [premiosDisponiveis, setPremiosDisponiveis] = useState<Premio[]>([])
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [selectedPrizeIndex, setSelectedPrizeIndex] = useState(-1)
  const [spinCompleted, setSpinCompleted] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já tem um jogo ativo e buscar prêmios disponíveis
    const verificarJogo = async () => {
      try {
        setLoading(true)
        // Verificar se há um jogo ativo sem realizar um novo jogo
        const result = await verificarJogoAtivo()

        // Buscar prêmios disponíveis para a roleta
        const premiosResult = await buscarPremiosBarbearia()
        if (premiosResult.success && premiosResult.premios) {
          setPremiosDisponiveis(premiosResult.premios)
        }

        if (result.jogoExistente) {
          // Se já existe um jogo ativo, armazenar os dados mas não mostrar o ticket automaticamente
          setJogoAtual({
            id: result.jogoExistente.id,
            premio: {
              id: result.jogoExistente.premio.id,
              titulo: result.jogoExistente.premio.titulo,
              descricao: result.jogoExistente.premio.descricao,
              codigo: result.jogoExistente.premio.codigo,
            },
            barbearia: {
              nome: result.jogoExistente.barbearia.nome,
              whatsapp: result.jogoExistente.barbearia.whatsapp,
              mensagemMarketing: result.jogoExistente.barbearia.mensagemMarketing,
              logoUrl: result.jogoExistente.barbearia.logoUrl,
            },
            dataExpiracao: result.jogoExistente.dataExpiracao,
          })

          // Indicar que há um jogo ativo, mas não mostrar o ticket automaticamente
          setTemJogoAtivo(true)

          // Calcular countdown
          const segundosRestantes = differenceInSeconds(new Date(result.jogoExistente.dataExpiracao), new Date())
          setCountdown(Math.max(0, segundosRestantes))
        } else if (result.semPremios) {
          setSemPremios(true)
        }
      } catch (error) {
        console.error("Erro ao verificar jogo ativo:", error)
      } finally {
        setLoading(false)
        setVerificado(true)
      }
    }

    verificarJogo()
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
    setSpinCompleted(false)

    try {
      // Realizar o jogo imediatamente para determinar o prêmio
      const result = await realizarJogo()

      if (result.error) {
        setError(result.error)
        setIsSpinning(false)
        return
      }

      if (result.semPremios) {
        setSemPremios(true)
        setIsSpinning(false)
        return
      }

      if (result.success) {
        setJogoAtual(result.jogo)

        // Encontrar o índice do prêmio sorteado na lista de prêmios disponíveis
        const premioIndex = premiosDisponiveis.findIndex((p) => p.id === result.jogo.premio.id)
        setSelectedPrizeIndex(premioIndex >= 0 ? premioIndex : Math.floor(Math.random() * premiosDisponiveis.length))

        // Calcular countdown
        const segundosRestantes = differenceInSeconds(new Date(result.jogo.dataExpiracao), new Date())
        setCountdown(Math.max(0, segundosRestantes))

        // Enviar email de notificação
        if (result.emailEnviado) {
          setEmailEnviado(true)
        }
      } else if (result.jogoExistente) {
        // Se já existe um jogo, mostrar o ticket após a animação
        setJogoAtual({
          id: result.jogoExistente.id,
          premio: {
            id: result.jogoExistente.premio.id,
            titulo: result.jogoExistente.premio.titulo,
            descricao: result.jogoExistente.premio.descricao,
            codigo: result.jogoExistente.premio.codigo,
          },
          barbearia: {
            nome: result.jogoExistente.barbearia.nome,
            whatsapp: result.jogoExistente.barbearia.whatsapp,
            mensagemMarketing: result.jogoExistente.barbearia.mensagemMarketing,
            logoUrl: result.jogoExistente.barbearia.logoUrl,
          },
          dataExpiracao: result.jogoExistente.dataExpiracao,
        })

        // Encontrar o índice do prêmio existente
        const premioIndex = premiosDisponiveis.findIndex((p) => p.id === result.jogoExistente.premio.id)
        setSelectedPrizeIndex(premioIndex >= 0 ? premioIndex : Math.floor(Math.random() * premiosDisponiveis.length))
      }
    } catch (error) {
      console.error("Erro ao realizar jogo:", error)
      setError("Ocorreu um erro ao realizar o jogo. Tente novamente.")
      setIsSpinning(false)
    }
  }

  const handleSpinComplete = () => {
    setSpinCompleted(true)
    setIsSpinning(false)

    // Mostrar o ticket após um pequeno delay para melhor experiência do usuário
    setTimeout(() => {
      setShowTicket(true)

      // Mostrar toast de sucesso
      if (emailEnviado) {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para ver seu prêmio.",
        })
      }
    }, 1000)
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
                {jogoAtual?.barbearia.logoUrl ? (
                  <Image
                    src={jogoAtual.barbearia.logoUrl || "/placeholder.svg"}
                    alt="Logo da Barbearia"
                    width={128}
                    height={128}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Image
                    src="/placeholder.svg?height=128&width=128"
                    alt="Logo da Barbearia"
                    width={128}
                    height={128}
                    className="rounded-full object-cover"
                  />
                )}
              </div>

              <h2 className="text-2xl font-bold text-center mb-2">Gire a Roleta e Ganhe!</h2>
              <p className="text-center text-muted-foreground mb-6">
                Clique no botão abaixo para girar a roleta e ganhar seu prêmio
              </p>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm w-full">{error}</div>}

              {semPremios ? (
                <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-800" />
                  <AlertDescription className="text-yellow-800">
                    Esta barbearia ainda não cadastrou prêmios. Por favor, tente novamente mais tarde.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mb-6">
                  <GameWheel
                    isSpinning={isSpinning}
                    premios={premiosDisponiveis}
                    selectedPrizeIndex={selectedPrizeIndex}
                    onSpinComplete={handleSpinComplete}
                  />
                </div>
              )}

              {temJogoAtivo ? (
                <div className="mt-2 flex flex-col items-center">
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
                      disabled={isSpinning || semPremios}
                      className="bg-gray-800 hover:bg-gray-700 text-white"
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
                    disabled={isSpinning || semPremios}
                    size="lg"
                    className="mt-2 bg-gray-800 hover:bg-gray-700 text-white text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                    style={{ backgroundColor: "var(--cor-primaria)", color: "white" }}
                  >
                    {isSpinning ? "Girando..." : "Girar a Roleta!"}
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

                {emailEnviado && (
                  <Alert className="mt-4 mb-2 bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      Enviamos os detalhes do seu prêmio para o seu email!
                    </AlertDescription>
                  </Alert>
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
