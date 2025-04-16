-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENTE');

-- CreateTable
CREATE TABLE "Barbearia" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT,
    "whatsapp" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "logoUrl" TEXT,
    "mensagemMarketing" TEXT,
    "corPrimaria" TEXT NOT NULL DEFAULT '#9333ea',
    "corSecundaria" TEXT NOT NULL DEFAULT '#ec4899',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barbearia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "barbeariaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premio" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "chance" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "barbeariaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Premio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "premioId" TEXT NOT NULL,
    "barbeariaId" TEXT NOT NULL,
    "resgatado" BOOLEAN NOT NULL DEFAULT false,
    "dataResgate" TIMESTAMP(3),
    "dataExpiracao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL,
    "limiteJogosMes" INTEGER NOT NULL DEFAULT 1,
    "diasValidade" INTEGER NOT NULL DEFAULT 30,
    "barbeariaId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Barbearia_email_key" ON "Barbearia"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_barbeariaId_key" ON "Usuario"("email", "barbeariaId");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracao_barbeariaId_key" ON "Configuracao"("barbeariaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Premio" ADD CONSTRAINT "Premio_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_premioId_fkey" FOREIGN KEY ("premioId") REFERENCES "Premio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuracao" ADD CONSTRAINT "Configuracao_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
