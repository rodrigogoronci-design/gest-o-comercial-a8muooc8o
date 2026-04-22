CREATE TABLE IF NOT EXISTS public.atividades_comerciais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    demanda TEXT NOT NULL,
    data_atividade DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.atividades_comerciais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.atividades_comerciais;
CREATE POLICY "Allow all access to authenticated users" ON public.atividades_comerciais
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_atividades_cliente_id ON public.atividades_comerciais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_atividades_data ON public.atividades_comerciais(data_atividade);
