-- Ensure the proposals bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS policies for the bucket objects
DROP POLICY IF EXISTS "Public access to proposals" ON storage.objects;
CREATE POLICY "Public access to proposals" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Authenticated users can upload proposals" ON storage.objects;
CREATE POLICY "Authenticated users can upload proposals" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Authenticated users can update proposals" ON storage.objects;
CREATE POLICY "Authenticated users can update proposals" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'proposals');

DROP POLICY IF EXISTS "Authenticated users can delete proposals" ON storage.objects;
CREATE POLICY "Authenticated users can delete proposals" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'proposals');

-- Ensure RLS on crm_propostas is correctly set up for reading and writing
DROP POLICY IF EXISTS "crm_propostas_all_authenticated" ON public.crm_propostas;
CREATE POLICY "crm_propostas_all_authenticated" ON public.crm_propostas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
