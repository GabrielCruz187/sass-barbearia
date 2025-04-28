-- AlterTable
ALTER TABLE "Barbearia" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "corPrimaria" SET DEFAULT '#333333',
ALTER COLUMN "corSecundaria" SET DEFAULT '#666666';

-- AlterTable
ALTER TABLE "Jogo" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Premio" ALTER COLUMN "chance" SET DEFAULT 25;

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "barbeariaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "plano" TEXT NOT NULL DEFAULT 'mensal',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "dataInicio" TIMESTAMP(3),
    "ultimoPagamento" TIMESTAMP(3),
    "dataProximaCobranca" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_barbeariaId_key" ON "Assinatura"("barbeariaId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_stripeCustomerId_key" ON "Assinatura"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_stripeSubscriptionId_key" ON "Assinatura"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
