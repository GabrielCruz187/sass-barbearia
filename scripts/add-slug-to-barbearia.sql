-- Adicionar campo slug à tabela Barbearia
ALTER TABLE "Barbearia" ADD COLUMN "slug" VARCHAR(255);

-- Criar índice único para o slug
CREATE UNIQUE INDEX "Barbearia_slug_key" ON "Barbearia"("slug");

-- Gerar slugs para barbearias existentes (exemplo)
UPDATE "Barbearia" 
SET "slug" = LOWER(REPLACE(REPLACE(nome, ' ', '-'), 'ã', 'a'))
WHERE "slug" IS NULL;
