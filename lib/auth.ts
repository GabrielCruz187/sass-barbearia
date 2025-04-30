// Atualizar o arquivo auth.ts para verificar o status de pagamento no localStorage

import type { AuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"
import type { User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        userType: { label: "Tipo de Usuário", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.userType) {
          console.log("Credenciais incompletas")
          return null
        }

        try {
          if (credentials.userType === "barbearia") {
            // Login como barbearia (admin)
            const barbearia = await prisma.barbearia.findUnique({
              where: {
                email: credentials.email,
              },
            })

            if (!barbearia) {
              console.log("Barbearia não encontrada")
              return null
            }

            const senhaCorreta = await compare(credentials.password, barbearia.senha)

            if (!senhaCorreta) {
              console.log("Senha incorreta para barbearia")
              return null
            }

            // Verificar se a barbearia "pagou" (usando localStorage)
            const assinaturaStatus = "inactive"

            // No lado do servidor, não podemos acessar localStorage diretamente
            // Isso será verificado no lado do cliente no componente AdminLayout
            // Definimos um valor padrão aqui

            console.log("Barbearia autenticada com sucesso:", barbearia.id)

            return {
              id: barbearia.id,
              name: barbearia.nome,
              email: barbearia.email,
              role: "ADMIN",
              barbeariaId: barbearia.id,
              assinaturaStatus: assinaturaStatus,
            }
          } else {
            // Login como cliente
            const usuario = await prisma.usuario.findFirst({
              where: {
                email: credentials.email,
              },
            })

            if (!usuario) {
              console.log("Usuário não encontrado")
              return null
            }

            const senhaCorreta = await compare(credentials.password, usuario.senha)

            if (!senhaCorreta) {
              console.log("Senha incorreta para usuário")
              return null
            }

            // Verificar se a barbearia do cliente existe
            const barbearia = await prisma.barbearia.findUnique({
              where: {
                id: usuario.barbeariaId,
              },
            })

            if (!barbearia) {
              console.log("A barbearia do cliente não existe")
              // Você pode optar por retornar null aqui para impedir o login
            }

            console.log("Usuário autenticado com sucesso:", usuario.id)

            return {
              id: usuario.id,
              name: usuario.nome,
              email: usuario.email,
              role: usuario.role,
              barbeariaId: usuario.barbeariaId,
            }
          }
        } catch (error) {
          console.error("Erro durante a autenticação:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
    }: { token: JWT; user?: User & { role?: string; barbeariaId?: string; assinaturaStatus?: string } }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.barbeariaId = user.barbeariaId
        token.assinaturaStatus = user.assinaturaStatus
      }
      return token
    },
    async session({
      session,
      token,
    }: { session: Session; token: JWT & { role?: string; barbeariaId?: string; assinaturaStatus?: string } }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.barbeariaId = token.barbeariaId as string
        session.user.assinaturaStatus = token.assinaturaStatus as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "um-segredo-muito-seguro-para-desenvolvimento",
  debug: process.env.NODE_ENV === "development",
}
