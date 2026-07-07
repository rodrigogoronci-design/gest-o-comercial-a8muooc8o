-- Idempotent migration: ensure clientes table has all columns needed for CNPJ auto-fill
-- and add a configuration entry for the CNPJ lookup feature

-- Ensure all columns required by the CNPJ auto-fill feature exist
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS endereco TEXT;

-- Add configuration entry for CNPJ lookup service (idempotent)
INSERT INTO public.configuracoes (chave, valor, updated_at)
VALUES (
  'cnpj_lookup_enabled',
  '{"enabled": true, "provider": "brasilapi", "fallback": "receitaws"}'::jsonb,
  NOW()
)
ON CONFLICT (chave) DO NOTHING;
