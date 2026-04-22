ALTER TABLE public.atividades_comerciais ALTER COLUMN cliente_id DROP NOT NULL;
ALTER TABLE public.atividades_comerciais ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
