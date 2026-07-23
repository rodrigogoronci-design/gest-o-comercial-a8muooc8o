INSERT INTO storage.buckets (id, name, public)
VALUES ('prospect-documents', 'prospect-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated select on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated select on prospect-documents"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "Allow authenticated insert on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated insert on prospect-documents"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "Allow authenticated delete on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated delete on prospect-documents"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "Allow authenticated update on prospect-documents" ON storage.objects;
CREATE POLICY "Allow authenticated update on prospect-documents"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'prospect-documents');
