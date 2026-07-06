-- Re-apply avatars bucket creation (idempotent) to recover from Redis OOM
-- on the original migration 20260706144742_create_avatars_bucket.sql

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Conditionally create storage policies (avoids DROP POLICY which triggers Redis OOM)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_public_read'
  ) THEN
    CREATE POLICY "avatars_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_authenticated_insert'
  ) THEN
    CREATE POLICY "avatars_authenticated_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_authenticated_update'
  ) THEN
    CREATE POLICY "avatars_authenticated_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars')
      WITH CHECK (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_authenticated_delete'
  ) THEN
    CREATE POLICY "avatars_authenticated_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'avatars');
  END IF;
END $$;
