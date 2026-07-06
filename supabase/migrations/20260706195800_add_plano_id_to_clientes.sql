ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES public.planos_saude(id) ON DELETE SET NULL;
