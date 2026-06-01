DO $$
BEGIN
  ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS valor_total numeric DEFAULT 0;
  ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS valor_adicional numeric DEFAULT 0;
END $$;
