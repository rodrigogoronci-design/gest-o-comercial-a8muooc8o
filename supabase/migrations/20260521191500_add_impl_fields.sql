DO $$
BEGIN
  -- Ensure crm_propostas has the necessary fields
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS valor_implantacao numeric NOT NULL DEFAULT 0;
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS itens jsonb NOT NULL DEFAULT '[]'::jsonb;
  
  -- Ensure clientes has the necessary fields
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS valor_implantacao numeric DEFAULT 0;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS modo_implantacao text DEFAULT 'remoto';
END $$;
