INSERT INTO storage.buckets (id, name, public)
VALUES ('prospect-documents', 'prospect-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated select on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated select on prospect-documents"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "Allow authenticated insert on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated insert on prospect-documents"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "Allow authenticated update on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated update on prospect-documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'prospect-documents')
  WITH CHECK (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "Allow authenticated delete on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated delete on prospect-documents"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "Allow authenticated select on proposals" ON storage.objects;
CREATE POLICY "Allow authenticated select on proposals"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Allow authenticated insert on proposals" ON storage.objects;
CREATE POLICY "Allow authenticated insert on proposals"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Allow authenticated update on proposals" ON storage.objects;
CREATE POLICY "Allow authenticated update on proposals"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'proposals')
  WITH CHECK (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Allow authenticated delete on proposals" ON storage.objects;
CREATE POLICY "Allow authenticated delete on proposals"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "crm_prospects_select_authenticated" ON public.crm_prospects;
CREATE POLICY "crm_prospects_select_authenticated" ON public.crm_prospects
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "crm_prospects_insert_authenticated" ON public.crm_prospects;
CREATE POLICY "crm_prospects_insert_authenticated" ON public.crm_prospects
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "crm_prospects_update_authenticated" ON public.crm_prospects;
CREATE POLICY "crm_prospects_update_authenticated" ON public.crm_prospects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_prospects_delete_authenticated" ON public.crm_prospects;
CREATE POLICY "crm_prospects_delete_authenticated" ON public.crm_prospects
  FOR DELETE TO authenticated USING (true);
