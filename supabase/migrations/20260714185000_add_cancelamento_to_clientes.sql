ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS data_cancelamento DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;
