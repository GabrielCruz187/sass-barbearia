import Link from "next/link"
import { Button } from "@/components/ui/button"
import "@/app/styles/globals.css"
import "@/components/color-provider"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-500 to-pink-500">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-3xl w-full text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">Sistema de Premiação para Barbearias</h1>
          <p className="text-xl">
            Aumente o engajamento dos seus clientes com um sistema de premiação divertido e eficaz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <Link href="/login">Entrar no Sistema</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/cadastro">Cadastrar Barbearia</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-white/80">
        <p>© {new Date().getFullYear()} Prêmio Barbershop. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
