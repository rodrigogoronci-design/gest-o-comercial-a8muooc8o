-- Create storage bucket for signed contracts
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS policies for the contracts bucket
DROP POLICY IF EXISTS "contracts_public_read" ON storage.objects;
CREATE POLICY "contracts_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'contracts');

DROP POLICY IF EXISTS "contracts_authenticated_insert" ON storage.objects;
CREATE POLICY "contracts_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contracts');

DROP POLICY IF EXISTS "contracts_authenticated_update" ON storage.objects;
CREATE POLICY "contracts_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'contracts') WITH CHECK (bucket_id = 'contracts');

DROP POLICY IF EXISTS "contracts_authenticated_delete" ON storage.objects;
CREATE POLICY "contracts_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'contracts');
