import { PrismaClient } from "@prisma/client"

// PrismaClient é anexado ao objeto global em desenvolvimento para evitar
// múltiplas instâncias do Prisma Client em desenvolvimento
declare global {
  var prisma: PrismaClient | undefined
}

// Configuração para logs detalhados em desenvolvimento
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

const client = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== "production") global.prisma = client

export const prisma = client

export default prisma

