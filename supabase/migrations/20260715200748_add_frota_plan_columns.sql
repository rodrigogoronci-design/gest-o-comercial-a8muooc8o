ALTER TABLE public.planos_saude ADD COLUMN IF NOT EXISTS franquia_quantidade INTEGER;
ALTER TABLE public.planos_saude ADD COLUMN IF NOT EXISTS valor_excedente NUMERIC DEFAULT 0;
