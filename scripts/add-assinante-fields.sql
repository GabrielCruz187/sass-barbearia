-- Adicionar campo assinante na tabela Usuario
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "assinante" BOOLEAN NOT NULL DEFAULT false;

-- Adicionar campo tipoCliente na tabela Premio  
ALTER TABLE "Premio" ADD COLUMN IF NOT EXISTS "tipoCliente" TEXT NOT NULL DEFAULT 'nao_assinante';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('Usuario', 'Premio') 
AND column_name IN ('assinante', 'tipoCliente');
