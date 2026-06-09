DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('proposals', 'proposals', true, 10485760, ARRAY['application/pdf']::text[])
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "proposals_read" ON storage.objects;
CREATE POLICY "proposals_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "proposals_insert" ON storage.objects;
CREATE POLICY "proposals_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proposals');

DROP POLICY IF EXISTS "proposals_delete" ON storage.objects;
CREATE POLICY "proposals_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "proposals_update" ON storage.objects;
CREATE POLICY "proposals_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'proposals');
