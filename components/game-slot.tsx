"use client"

import { useEffect, useRef, useState } from "react"

interface GameSlotProps {
  isSpinning: boolean
}

const prizes = ["corte grátis", "Produto", "Desconto", "Brinde", "Lefo", "Fefo"]

export function GameSlot({ isSpinning }: GameSlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(0)
  const [speed, setSpeed] = useState(0.15) // Velocidade inicial de giro
  const [spinning, setSpinning] = useState(false) // controle interno
  const requestRef = useRef<number | null>(null)

  const idleSpeed = 0.001

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawWheel = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(centerX, centerY) - 10
      const sliceAngle = (2 * Math.PI) / prizes.length

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < prizes.length; i++) {
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
        ctx.font = "20px Arial"
        ctx.fillText(prizes[i], radius - 10, 10)
        ctx.restore()
      }
    }

    const animate = () => {
      setAngle((prev) => {
        const delta = spinning ? speed : idleSpeed
        return (prev + delta) % (2 * Math.PI)
      })

      if (spinning) {
        setSpeed((prevSpeed) => {
          const newSpeed = prevSpeed * 0.99
          if (newSpeed <= 0.02) {
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
  }, [angle, speed, spinning])

  useEffect(() => {
    if (isSpinning) {
      setSpinning(true)
      setSpeed(0.15) 
    }
  }, [isSpinning])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <img
        src="/seta.png"
        alt="Indicador"
        className="absolute top-[8px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 z-50"
      />

      <div className="bg-white rounded-full overflow-hidden relative border-8 border-gradient-to-r from-yellow-400 via-orange-500 to-red-600 shadow-lg">
        <canvas ref={canvasRef} width={300} height={300} className="w-full h-full" />
      </div>
    </div>
  )
}