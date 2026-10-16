-- Migration aditiva para suporte a SLA Diferenciado em propostas comerciais
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS sla_ativo BOOLEAN DEFAULT false;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS percentual_sla NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS valor_sla NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS descricao_sla TEXT DEFAULT '';
