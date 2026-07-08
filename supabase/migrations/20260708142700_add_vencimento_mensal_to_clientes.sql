ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS vencimento_mensal INTEGER;

-- Existing RLS policies on clientes already allow ALL operations
-- for both authenticated and anon roles, so the new column is covered.
