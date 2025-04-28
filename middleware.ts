import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Registrar todas as navegações para depuração
  console.log("Middleware - Navegação para:", request.nextUrl.pathname)

  // Verificar se é uma navegação para o checkout ou assinatura
  if (request.nextUrl.pathname === "/checkout" || request.nextUrl.pathname === "/admin/assinatura") {
    console.log("Middleware - Parâmetros de checkout/assinatura:", request.nextUrl.search)

    // Não interferir com a navegação para estas rotas
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

