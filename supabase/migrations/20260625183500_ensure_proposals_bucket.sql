DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('proposals', 'proposals', true, 52428800, '{"application/pdf"}')
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

DROP POLICY IF EXISTS "Public Access Proposals" ON storage.objects;
CREATE POLICY "Public Access Proposals" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Authenticated Upload Proposals" ON storage.objects;
CREATE POLICY "Authenticated Upload Proposals" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Authenticated Update Proposals" ON storage.objects;
CREATE POLICY "Authenticated Update Proposals" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Authenticated Delete Proposals" ON storage.objects;
CREATE POLICY "Authenticated Delete Proposals" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'proposals');
