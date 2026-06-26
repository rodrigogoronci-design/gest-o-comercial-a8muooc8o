-- Ensure columns exist and have the correct default JSONB structures for branches
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cobrar_filiais boolean DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS quantidade_filiais integer DEFAULT 0;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS filiais_detalhes jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS cobrar_filiais boolean DEFAULT false;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS quantidade_filiais integer DEFAULT 0;
ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS filiais_detalhes jsonb DEFAULT '[]'::jsonb;

-- Ensure RLS policies allow authenticated users to perform operations on these tables
-- For clientes
DROP POLICY IF EXISTS "clientes_all_authenticated" ON public.clientes;
CREATE POLICY "clientes_all_authenticated" ON public.clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- For crm_propostas
DROP POLICY IF EXISTS "crm_propostas_all_authenticated" ON public.crm_propostas;
CREATE POLICY "crm_propostas_all_authenticated" ON public.crm_propostas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
