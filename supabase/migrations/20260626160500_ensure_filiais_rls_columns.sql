DO $$
BEGIN
  -- Ensure the JSONB column for branch details and the flag to charge exist on the clientes table
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS filiais_detalhes JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cobrar_filiais BOOLEAN DEFAULT true;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS quantidade_filiais INTEGER DEFAULT 0;

  -- Ensure the JSONB column for branch details and the flag to charge exist on the crm_propostas table
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS filiais_detalhes JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS cobrar_filiais BOOLEAN DEFAULT false;
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS quantidade_filiais INTEGER DEFAULT 0;

  -- Explicitly grant UPDATE and INSERT permissions on these specific columns for authenticated users to fulfill AC
  GRANT INSERT (filiais_detalhes, cobrar_filiais, quantidade_filiais) ON public.clientes TO authenticated;
  GRANT UPDATE (filiais_detalhes, cobrar_filiais, quantidade_filiais) ON public.clientes TO authenticated;

  GRANT INSERT (filiais_detalhes, cobrar_filiais, quantidade_filiais) ON public.crm_propostas TO authenticated;
  GRANT UPDATE (filiais_detalhes, cobrar_filiais, quantidade_filiais) ON public.crm_propostas TO authenticated;
END $$;
