DO $$
BEGIN
  -- Ensure columns exist in crm_propostas
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS cobrar_filiais boolean DEFAULT false;
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS quantidade_filiais integer DEFAULT 0;

  -- Ensure columns exist in clientes
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cobrar_filiais boolean DEFAULT false;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS quantidade_filiais integer DEFAULT 0;
END $$;

-- Ensure RLS is active
ALTER TABLE public.crm_propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Recreate policies for crm_propostas to ensure authenticated users can manage them
DROP POLICY IF EXISTS "crm_propostas_all_authenticated" ON public.crm_propostas;
CREATE POLICY "crm_propostas_all_authenticated" ON public.crm_propostas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Recreate policies for clientes to ensure authenticated users can manage them
DROP POLICY IF EXISTS "clientes_all_authenticated" ON public.clientes;
CREATE POLICY "clientes_all_authenticated" ON public.clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
