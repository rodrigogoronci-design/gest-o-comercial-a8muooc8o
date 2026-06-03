ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS status text DEFAULT 'Enviada';
ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS data_aceite timestamp with time zone;
