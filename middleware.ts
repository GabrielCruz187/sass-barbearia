import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Adicionar logs para debug
  console.log("Middleware - pathname:", pathname)

  // Ignorar rotas de API de autenticação para evitar loops
  if (pathname.startsWith("/api/auth")) {
    console.log("Ignorando rota de API de autenticação:", pathname)
    return NextResponse.next()
  }

  // Verificar token de autenticação
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "um-segredo-muito-seguro-para-desenvolvimento",
  })

  console.log("Middleware - token:", token ? `Autenticado como ${token.role}` : "Não autenticado")

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/", "/login", "/cadastro"]
  if (publicRoutes.includes(pathname)) {
    // Permitir acesso à página inicial mesmo para usuários autenticados
    if (pathname === "/" && token) {
      console.log("Usuário autenticado acessando a página inicial")
      return NextResponse.next()
    }

    // Para login e cadastro, redirecionar usuários autenticados
    if (token && pathname !== "/") {
      console.log("Usuário autenticado tentando acessar rota pública")
      if (token.role === "ADMIN") {
        console.log("Redirecionando admin para dashboard")
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      } else {
        console.log("Redirecionando cliente para jogo")
        return NextResponse.redirect(new URL("/cliente/jogo", request.url))
      }
    }
    return NextResponse.next()
  }

  // Se não estiver autenticado, redirecionar para login
  if (!token) {
    console.log("Usuário não autenticado, redirecionando para login")
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // Verificar permissões para rotas de admin
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    console.log("Cliente tentando acessar área de admin, redirecionando")
    return NextResponse.redirect(new URL("/cliente/jogo", request.url))
  }

  // Verificar permissões para rotas de cliente
  if (pathname.startsWith("/cliente") && token.role === "ADMIN") {
    console.log("Admin tentando acessar área de cliente, redirecionando")
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configurar quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

