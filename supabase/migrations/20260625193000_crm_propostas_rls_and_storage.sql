DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE public.crm_propostas ENABLE ROW LEVEL SECURITY;
END $$;

DROP POLICY IF EXISTS "crm_propostas_select" ON public.crm_propostas;
CREATE POLICY "crm_propostas_select" ON public.crm_propostas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "crm_propostas_insert" ON public.crm_propostas;
CREATE POLICY "crm_propostas_insert" ON public.crm_propostas
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "crm_propostas_update" ON public.crm_propostas;
CREATE POLICY "crm_propostas_update" ON public.crm_propostas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_propostas_delete" ON public.crm_propostas;
CREATE POLICY "crm_propostas_delete" ON public.crm_propostas
  FOR DELETE TO authenticated USING (true);
