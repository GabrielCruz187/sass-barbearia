-- AlterTable
ALTER TABLE "Premio" ADD COLUMN     "tipoCliente" TEXT NOT NULL DEFAULT 'nao_assinante';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "assinante" BOOLEAN NOT NULL DEFAULT false;
