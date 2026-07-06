DROP POLICY IF EXISTS "crm_prospects_update_authenticated" ON public.crm_prospects;
CREATE POLICY "crm_prospects_update_authenticated" ON public.crm_prospects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
