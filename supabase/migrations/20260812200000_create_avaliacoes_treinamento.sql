CREATE TABLE IF NOT EXISTS public.avaliacoes_treinamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementacao_id UUID NOT NULL REFERENCES public.implementacoes(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    nota INTEGER,
    comentarios TEXT,
    status TEXT NOT NULL DEFAULT 'nao_enviada',
    data_envio TIMESTAMPTZ,
    data_avaliacao TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT avaliacoes_treinamento_nota_check CHECK (nota IS NULL OR (nota >= 1 AND nota <= 5)),
    CONSTRAINT avaliacoes_treinamento_status_check CHECK (status IN ('nao_enviada', 'enviada', 'avaliada'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_avaliacoes_treinamento_token ON public.avaliacoes_treinamento(token);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_treinamento_impl_id ON public.avaliacoes_treinamento(implementacao_id);

ALTER TABLE public.avaliacoes_treinamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avaliacoes_treinamento_select_auth" ON public.avaliacoes_treinamento;
CREATE POLICY "avaliacoes_treinamento_select_auth" ON public.avaliacoes_treinamento
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "avaliacoes_treinamento_insert_auth" ON public.avaliacoes_treinamento;
CREATE POLICY "avaliacoes_treinamento_insert_auth" ON public.avaliacoes_treinamento
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "avaliacoes_treinamento_update_auth" ON public.avaliacoes_treinamento;
CREATE POLICY "avaliacoes_treinamento_update_auth" ON public.avaliacoes_treinamento
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "avaliacoes_treinamento_delete_auth" ON public.avaliacoes_treinamento;
CREATE POLICY "avaliacoes_treinamento_delete_auth" ON public.avaliacoes_treinamento
    FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "avaliacoes_treinamento_anon_select" ON public.avaliacoes_treinamento;
CREATE POLICY "avaliacoes_treinamento_anon_select" ON public.avaliacoes_treinamento
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "avaliacoes_treinamento_anon_update" ON public.avaliacoes_treinamento;
CREATE POLICY "avaliacoes_treinamento_anon_update" ON public.avaliacoes_treinamento
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_avaliacao_treinamento(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'id', a.id,
        'implementacao_id', a.implementacao_id,
        'status', a.status,
        'nota', a.nota,
        'comentarios', a.comentarios,
        'data_avaliacao', a.data_avaliacao,
        'cliente_nome', COALESCE(i.cliente_nome, c.nome),
        'treinamento_motivo', i.treinamento_motivo,
        'treinamento_topicos', i.treinamento_topicos,
        'modulos_novos', i.modulos_novos
    )
    FROM public.avaliacoes_treinamento a
    JOIN public.implementacoes i ON i.id = a.implementacao_id
    LEFT JOIN public.clientes c ON c.id = i.cliente_id
    WHERE a.token = p_token
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.submit_avaliacao_treinamento(
    p_token uuid,
    p_nota integer,
    p_comentarios text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
BEGIN
    SELECT id INTO v_id FROM public.avaliacoes_treinamento
    WHERE token = p_token AND status != 'avaliada';

    IF v_id IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.avaliacoes_treinamento
    SET
        nota = p_nota,
        comentarios = p_comentarios,
        status = 'avaliada',
        data_avaliacao = NOW(),
        updated_at = NOW()
    WHERE id = v_id;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_avaliacao_treinamento(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_avaliacao_treinamento(uuid, integer, text) TO anon, authenticated;
