-- Make sure the columns exist
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cobrar_filiais BOOLEAN DEFAULT FALSE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS quantidade_filiais INTEGER DEFAULT 0;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS filiais_detalhes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS cobrar_filiais BOOLEAN DEFAULT FALSE;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS quantidade_filiais INTEGER DEFAULT 0;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS filiais_detalhes JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS is active
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_propostas ENABLE ROW LEVEL SECURITY;

-- Recreate policies for authenticated users
DROP POLICY IF EXISTS "clientes_all_authenticated" ON public.clientes;
CREATE POLICY "clientes_all_authenticated" ON public.clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_propostas_all_authenticated" ON public.crm_propostas;
CREATE POLICY "crm_propostas_all_authenticated" ON public.crm_propostas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
