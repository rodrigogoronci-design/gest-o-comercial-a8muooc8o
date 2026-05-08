CREATE TABLE IF NOT EXISTS public.solicitacoes_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data_solicitacao DATE,
    valor NUMERIC,
    forma_pagamento TEXT,
    data_vencimento DATE,
    observacoes TEXT,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.solicitacoes_servico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.solicitacoes_servico;
CREATE POLICY "Allow all access to authenticated users" ON public.solicitacoes_servico
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_solicitacoes_servico_cliente_id ON public.solicitacoes_servico USING btree (cliente_id);
