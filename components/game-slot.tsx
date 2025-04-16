"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface GameSlotProps {
  isSpinning: boolean
}

export function GameSlot({ isSpinning }: GameSlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const symbols = ["🎁", "💈", "✂️", "💰", "🏆", "💎"]
    let animationId: number
    let currentPosition = 0
    let speed = 0
    const acceleration = 0.5
    const maxSpeed = 30

    const drawSymbols = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = "40px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      for (let i = 0; i < 3; i++) {
        const symbolIndex = Math.floor((currentPosition + i) % symbols.length)
        ctx.fillText(symbols[symbolIndex], canvas.width / 2, 50 + i * 60)
      }
    }

    const animate = () => {
      if (isSpinning) {
        if (speed < maxSpeed) {
          speed += acceleration
        }
        currentPosition += speed

        if (currentPosition >= 1000) {
          currentPosition = 0
        }
      } else {
        if (speed > 0) {
          speed *= 0.95
          currentPosition += speed

          if (speed < 0.5) {
            speed = 0
            currentPosition = Math.round(currentPosition)
          }
        }
      }

      drawSymbols()
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isSpinning])

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-4 shadow-lg">
        <div className="bg-white rounded-md overflow-hidden relative">
          <canvas ref={canvasRef} width={200} height={180} className="w-full" />

          {/* Indicator line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500 transform -translate-y-1/2" />

          {/* Overlay effect */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent opacity-50" />
        </div>
      </div>

      {isSpinning && (
        <motion.div
          className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-lg border-4 border-yellow-300"
          animate={{
            boxShadow: ["0 0 0 rgba(250, 204, 21, 0)", "0 0 20px rgba(250, 204, 21, 0.8)"],
            borderColor: ["rgb(250, 204, 21)", "rgb(234, 179, 8)"],
          }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      )}
    </div>
  )
}
