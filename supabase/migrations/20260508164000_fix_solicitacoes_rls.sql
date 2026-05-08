ALTER TABLE public.solicitacoes_servico ENABLE ROW LEVEL SECURITY;

-- Remove a política anterior que poderia estar restrita apenas a usuários autenticados,
-- o que pode causar falhas caso a sessão esteja expirada ou seja tratada como anon
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.solicitacoes_servico;
DROP POLICY IF EXISTS "solicitacoes_servico_select" ON public.solicitacoes_servico;
DROP POLICY IF EXISTS "solicitacoes_servico_insert" ON public.solicitacoes_servico;
DROP POLICY IF EXISTS "solicitacoes_servico_update" ON public.solicitacoes_servico;
DROP POLICY IF EXISTS "solicitacoes_servico_delete" ON public.solicitacoes_servico;

-- Cria políticas permissivas cobrindo todas as operações e roles (public),
-- garantindo que a inserção não falhe por RLS
CREATE POLICY "solicitacoes_servico_select" ON public.solicitacoes_servico 
    FOR SELECT USING (true);

CREATE POLICY "solicitacoes_servico_insert" ON public.solicitacoes_servico 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "solicitacoes_servico_update" ON public.solicitacoes_servico 
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "solicitacoes_servico_delete" ON public.solicitacoes_servico 
    FOR DELETE USING (true);
