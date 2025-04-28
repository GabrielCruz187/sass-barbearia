import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Registrar todas as navegações para depuração
  console.log("Middleware - Navegação para:", request.nextUrl.pathname)

  // Verificar se é uma navegação para o checkout
  if (request.nextUrl.pathname === "/checkout") {
    console.log("Middleware - Parâmetros de checkout:", request.nextUrl.search)
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

