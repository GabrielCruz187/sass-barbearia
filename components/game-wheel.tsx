"use client"

import { useEffect, useRef, useState } from "react"

interface Premio {
  id: string
  titulo: string
}

interface GameWheelProps {
  isSpinning: boolean
  premios?: Premio[]
  selectedPrizeIndex?: number
  onSpinComplete?: () => void
}

export function GameWheel({ isSpinning, premios = [], selectedPrizeIndex = -1, onSpinComplete }: GameWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(0)
  const [speed, setSpeed] = useState(0.15) // Velocidade inicial de giro
  const [spinning, setSpinning] = useState(false) // controle interno
  const [loadedPremios, setLoadedPremios] = useState<string[]>([])
  const requestRef = useRef<number | null>(null)
  const spinCompletedRef = useRef(false)

  const idleSpeed = 0.001

  // Usar prêmios fornecidos ou fallback para símbolos padrão
  useEffect(() => {
    if (premios && premios.length > 0) {
      setLoadedPremios(premios.map((premio) => premio.titulo))
    } else {
      // Prêmios padrão como fallback
      setLoadedPremios(["🎁 Prêmio", "💈 Desconto", "✂️ Corte", "💰 Oferta", "🏆 Brinde", "🧴 Produto"])
    }
  }, [premios])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loadedPremios.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawWheel = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(centerX, centerY) - 10
      const sliceAngle = (2 * Math.PI) / loadedPremios.length

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < loadedPremios.length; i++) {
        const startAngle = angle + i * sliceAngle
        const endAngle = startAngle + sliceAngle

        const colors = ["#4169E1", "#FFD700", "#B22222", "#28A745"] // Azul, Amarelo, Vermelho, Verde
        ctx.fillStyle = colors[i % colors.length]
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fill()

        // Texto do prêmio
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(startAngle + sliceAngle / 2)
        ctx.textAlign = "right"
        ctx.fillStyle = "#000"
        ctx.font = "bold 16px Arial"
        ctx.fillText(loadedPremios[i], radius - 20, 5)
        ctx.restore()
      }

      // Desenhar círculo central
      ctx.beginPath()
      ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI)
      ctx.fillStyle = "#333"
      ctx.fill()
    }

    const animate = () => {
      setAngle((prev) => {
        const delta = spinning ? speed : idleSpeed
        return (prev + delta) % (2 * Math.PI)
      })

      if (spinning) {
        setSpeed((prevSpeed) => {
          const newSpeed = prevSpeed * 0.99
          if (newSpeed <= 0.005) {
            // Se o prêmio foi selecionado e a roleta está quase parando
            if (selectedPrizeIndex >= 0 && !spinCompletedRef.current) {
              spinCompletedRef.current = true
              if (onSpinComplete) {
                setTimeout(() => {
                  onSpinComplete()
                }, 500)
              }
            }

            setSpinning(false)
            return 0.15
          }
          return newSpeed
        })
      }

      drawWheel()
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [angle, speed, spinning, loadedPremios, selectedPrizeIndex, onSpinComplete])

  // Iniciar o giro quando isSpinning muda para true
  useEffect(() => {
    if (isSpinning && !spinning) {
      setSpinning(true)
      setSpeed(0.15)
      spinCompletedRef.current = false

      // Se um prêmio específico foi selecionado, calcular o ângulo final
      if (selectedPrizeIndex >= 0 && loadedPremios.length > 0) {
        // Calcular quantas voltas completas (4 voltas + posição do prêmio)
        const targetRotations = 4 + (loadedPremios.length - selectedPrizeIndex) / loadedPremios.length

        // Ajustar a velocidade para que a roleta gire por mais tempo
        setSpeed(0.25)
      }
    }
  }, [isSpinning, spinning, selectedPrizeIndex, loadedPremios.length])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute top-[8px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 z-50">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0L25 15H15L20 0Z" fill="#FF0000" />
        </svg>
      </div>

      <div className="bg-white rounded-full overflow-hidden relative border-8 border-gradient-to-r from-yellow-400 via-orange-500 to-red-600 shadow-lg">
        <canvas ref={canvasRef} width={300} height={300} className="w-full h-full" />
      </div>
    </div>
  )
}
