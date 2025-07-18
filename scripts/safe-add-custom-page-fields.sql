-- SCRIPT SEGURO - Apenas adiciona campos novos sem alterar dados existentes

-- 1. Adicionar campo slug se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Barbearia' AND column_name = 'slug') THEN
        ALTER TABLE "Barbearia" ADD COLUMN "slug" TEXT;
        RAISE NOTICE 'Campo slug adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo slug já existe';
    END IF;
END $$;

-- 2. Adicionar campo paginaPersonalizada se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Barbearia' AND column_name = 'paginaPersonalizada') THEN
        ALTER TABLE "Barbearia" ADD COLUMN "paginaPersonalizada" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Campo paginaPersonalizada adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo paginaPersonalizada já existe';
    END IF;
END $$;

-- 3. Gerar slugs para barbearias que não têm (preservando dados existentes)
UPDATE "Barbearia" 
SET "slug" = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE("nome", '[áàâãäå]', 'a', 'gi'),
            '[éèêë]', 'e', 'gi'
        ) || '-' || SUBSTRING("id", 1, 8), 
        '[^a-z0-9\-]', 
        '-', 
        'g'
    )
)
WHERE "slug" IS NULL OR "slug" = '';

-- 4. Criar índice único para slug se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Barbearia_slug_key') THEN
        CREATE UNIQUE INDEX "Barbearia_slug_key" ON "Barbearia"("slug");
        RAISE NOTICE 'Índice único para slug criado com sucesso';
    ELSE
        RAISE NOTICE 'Índice único para slug já existe';
    END IF;
END $$;

-- 5. Verificar resultado (apenas consulta)
SELECT 
    COUNT(*) as total_barbearias,
    COUNT("slug") as barbearias_com_slug,
    COUNT(CASE WHEN "paginaPersonalizada" = true THEN 1 END) as paginas_personalizadas_ativas
FROM "Barbearia";
