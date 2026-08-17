-- Persiste o CNPJ informado no formulário de Captação (CaptacaoSimplifiedForm).
-- Coluna TEXT, nullable — o CNPJ é opcional. A coluna já pode existir de
-- migrações anteriores, por isso o comando é idempotente.
ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS cnpj TEXT;
