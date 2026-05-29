ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_desconto TEXT NOT NULL DEFAULT 'valor';
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS tipo_desconto TEXT NOT NULL DEFAULT 'valor';
ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS tipo_desconto TEXT NOT NULL DEFAULT 'valor';
