
import Link from "next/link"
import { Button } from "@/components/ui/button"
import "@/app/styles/globals.css"
import "@/components/color-provider"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-800 via-gray-600 to-gray-900">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="flex justify-center">
            <img src="/logo.webp" alt="Logo" className="max-w-xs h-auto" />
          </div>
          <h1 className="text-5x1 font-bold tracking-tight !text-4xl">Sistema de Premiação para Barbearias</h1>
          <p className="text-xl">
            Aumente o engajamento dos seus clientes com um sistema de premiação divertido e eficaz.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <Link href="/login">Entrar no Sistema</Link>
            </Button>
            <Button asChild size="lg" className="bg-white border-white text-black hover:bg-gray-300">
              <Link href="/cadastro">Cadastrar Barbearia</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-white/80">
        <p>© {new Date().getFullYear()} BarberSpin. Todos os direitos reservados.</p>
        <p>Desenvolvido por{" "}
          <a href="https://portifolio-nextstudio.vercel.app/?fbclid=PAZXh0bgNhZW0CMTEAAaerUcn-bFQA33J1elXh1FX1ExreO3VBk0uwl7I-wiGveYTFybdmd_hEQLI_7w_aem_p_PbN4jaqwDizO0EpvNpAQ" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-600">
          NextCode Studios</a>
        </p>
      </footer>
    </div>
  )

}
