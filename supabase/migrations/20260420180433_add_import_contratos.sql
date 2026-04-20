-- Add contrato_url to clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contrato_url TEXT;

-- Create storage bucket for contratos
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos', 'contratos', true) ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'contratos');

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contratos');
