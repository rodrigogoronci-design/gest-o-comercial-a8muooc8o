DO $$
BEGIN
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS data_envio TIMESTAMPTZ;
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS status_negociacao TEXT DEFAULT 'Gerada';
END $$;
