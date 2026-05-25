DO $$
BEGIN
  ALTER TABLE public.crm_propostas 
    ADD COLUMN IF NOT EXISTS filiais_detalhes JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cobrar_filiais BOOLEAN DEFAULT false;
END $$;
