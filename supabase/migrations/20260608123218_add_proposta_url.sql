DO $$
BEGIN
  ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS proposta_url TEXT;
END $$;

-- Create the storage bucket for CRM attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crm-attachments', 'crm-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Setup RLS Policies for the storage bucket
DROP POLICY IF EXISTS "Allow authenticated select on crm-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated select on crm-attachments" 
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'crm-attachments');

DROP POLICY IF EXISTS "Allow authenticated insert on crm-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated insert on crm-attachments" 
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'crm-attachments');

DROP POLICY IF EXISTS "Allow authenticated delete on crm-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated delete on crm-attachments" 
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'crm-attachments');

DROP POLICY IF EXISTS "Allow authenticated update on crm-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated update on crm-attachments" 
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'crm-attachments');
