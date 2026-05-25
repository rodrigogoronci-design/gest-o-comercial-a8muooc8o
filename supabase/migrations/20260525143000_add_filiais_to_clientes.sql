DO $$
BEGIN
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS filiais_detalhes jsonb DEFAULT '[]'::jsonb;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cobrar_filiais boolean DEFAULT true;
END $$;
