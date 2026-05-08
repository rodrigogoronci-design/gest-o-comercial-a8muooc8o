DO $$
BEGIN
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cobrancas JSONB DEFAULT '[]'::jsonb;
END $$;
