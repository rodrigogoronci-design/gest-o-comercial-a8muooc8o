CREATE TABLE IF NOT EXISTS public.atendimentos_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    data_atendimento TIMESTAMPTZ NOT NULL,
    solicitacao TEXT NOT NULL,
    relatorio TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.atendimentos_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atendimentos_clientes_select" ON public.atendimentos_clientes;
CREATE POLICY "atendimentos_clientes_select" ON public.atendimentos_clientes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "atendimentos_clientes_insert" ON public.atendimentos_clientes;
CREATE POLICY "atendimentos_clientes_insert" ON public.atendimentos_clientes
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "atendimentos_clientes_update" ON public.atendimentos_clientes;
CREATE POLICY "atendimentos_clientes_update" ON public.atendimentos_clientes
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "atendimentos_clientes_delete" ON public.atendimentos_clientes;
CREATE POLICY "atendimentos_clientes_delete" ON public.atendimentos_clientes
    FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_atendimentos_clientes_cliente_id ON public.atendimentos_clientes USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_clientes_data ON public.atendimentos_clientes USING btree (data_atendimento DESC);
