-- Adicionar campo para controlar se a barbearia quer página personalizada
ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "paginaPersonalizada" BOOLEAN DEFAULT false;
ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Criar índice para o slug
CREATE INDEX IF NOT EXISTS "Barbearia_slug_idx" ON "Barbearia"("slug");

-- Atualizar barbearias existentes que não têm slug
UPDATE "Barbearia" 
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(nome, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE "slug" IS NULL OR "slug" = '';

-- Garantir que slugs sejam únicos
WITH numbered_rows AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "createdAt") as rn
  FROM "Barbearia"
  WHERE slug IS NOT NULL
)
UPDATE "Barbearia" 
SET slug = CASE 
  WHEN numbered_rows.rn = 1 THEN numbered_rows.slug
  ELSE numbered_rows.slug || '-' || numbered_rows.rn
END
FROM numbered_rows 
WHERE "Barbearia".id = numbered_rows.id;
