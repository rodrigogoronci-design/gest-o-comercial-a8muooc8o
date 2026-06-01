ALTER TABLE public.solicitacoes_servico ADD COLUMN IF NOT EXISTS prazos_concedidos TEXT;
ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS prazos_concedidos TEXT;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS prazos_concedidos TEXT;
