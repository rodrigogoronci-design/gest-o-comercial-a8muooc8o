DO $$
BEGIN
    ALTER TABLE public.clientes 
      ADD COLUMN IF NOT EXISTS cobrar_filiais boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS quantidade_filiais integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS filiais_detalhes jsonb DEFAULT '[]'::jsonb;

    ALTER TABLE public.crm_propostas 
      ADD COLUMN IF NOT EXISTS cobrar_filiais boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS quantidade_filiais integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS filiais_detalhes jsonb DEFAULT '[]'::jsonb;
END $$;
