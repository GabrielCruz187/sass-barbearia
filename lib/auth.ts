import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcrypt"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "um-segredo-muito-seguro-para-desenvolvimento",
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        userType: { label: "Tipo de Usuário", type: "text" }, // "cliente" ou "barbearia"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.userType) {
          console.log("Credenciais incompletas")
          return null
        }

        console.log(`Tentando autenticar como ${credentials.userType}`)

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

            console.log("Barbearia encontrada, verificando senha")

            try {
              const senhaCorreta = await compare(credentials.password, barbearia.senha)

              if (!senhaCorreta) {
                console.log("Senha incorreta para barbearia")
                return null
              }

              console.log("Barbearia autenticada com sucesso:", barbearia.id)

              return {
                id: barbearia.id,
                name: barbearia.nome,
                email: barbearia.email,
                role: "ADMIN",
                barbeariaId: barbearia.id,
              }
            } catch (error) {
              console.error("Erro ao comparar senhas:", error)
              return null
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

            console.log("Usuário encontrado, verificando senha")

            try {
              const senhaCorreta = await compare(credentials.password, usuario.senha)

              if (!senhaCorreta) {
                console.log("Senha incorreta para usuário")
                return null
              }

              console.log("Usuário autenticado com sucesso:", usuario.id)

              return {
                id: usuario.id,
                name: usuario.nome,
                email: usuario.email,
                role: usuario.role,
                barbeariaId: usuario.barbeariaId,
              }
            } catch (error) {
              console.error("Erro ao comparar senhas:", error)
              return null
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
    async jwt({ token, user }) {
      if (user) {
        console.log("JWT callback - user:", user)
        token.id = user.id
        token.role = user.role
        token.barbeariaId = user.barbeariaId
      }
      console.log("JWT callback - token final:", token)
      return token
    },
    async session({ session, token }) {
      if (token) {
        console.log("Session callback - token:", token)
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.barbeariaId = token.barbeariaId as string
      }
      console.log("Session callback - session final:", session)
      return session
    },
  },
}
