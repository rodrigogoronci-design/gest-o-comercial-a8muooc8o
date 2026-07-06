-- Ensure authenticated users can INSERT into clientes for conversion flow
DROP POLICY IF EXISTS "clientes_insert_authenticated" ON public.clientes;
CREATE POLICY "clientes_insert_authenticated" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure authenticated users can UPDATE crm_prospects for conversion flow
DROP POLICY IF EXISTS "crm_prospects_update_conversion" ON public.crm_prospects;
CREATE POLICY "crm_prospects_update_conversion" ON public.crm_prospects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow anon read on prospect-documents bucket for public URL access
DROP POLICY IF EXISTS "prospect_docs_anon_read" ON storage.objects;
CREATE POLICY "prospect_docs_anon_read" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'prospect-documents');
