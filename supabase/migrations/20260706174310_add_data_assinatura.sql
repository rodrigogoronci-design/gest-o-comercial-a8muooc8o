ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS data_assinatura DATE;

-- Existing RLS policies on crm_prospects use FOR ALL with USING (true) WITH CHECK (true)
-- for both authenticated and anon roles, which already covers the new data_assinatura column.
-- No additional policy changes are required.
