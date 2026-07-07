ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS data_assinatura DATE;

-- Existing RLS policies on clientes already allow authenticated and anon roles
-- to perform ALL operations (SELECT, INSERT, UPDATE, DELETE), so the new
-- data_assinatura column is automatically covered. No additional policy changes needed.
