CREATE TABLE IF NOT EXISTS public.implementacao_observacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementacao_id UUID NOT NULL REFERENCES public.implementacoes(id) ON DELETE CASCADE,
    observacao TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_implementacao_observacoes_impl_id
    ON public.implementacao_observacoes(implementacao_id);

ALTER TABLE public.implementacao_observacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impl_observacoes_select" ON public.implementacao_observacoes;
CREATE POLICY "impl_observacoes_select" ON public.implementacao_observacoes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "impl_observacoes_insert" ON public.implementacao_observacoes;
CREATE POLICY "impl_observacoes_insert" ON public.implementacao_observacoes
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "impl_observacoes_update" ON public.implementacao_observacoes;
CREATE POLICY "impl_observacoes_update" ON public.implementacao_observacoes
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "impl_observacoes_delete" ON public.implementacao_observacoes;
CREATE POLICY "impl_observacoes_delete" ON public.implementacao_observacoes
    FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_observacao_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_observacao_updated_at ON public.implementacao_observacoes;
CREATE TRIGGER trg_observacao_updated_at
    BEFORE UPDATE ON public.implementacao_observacoes
    FOR EACH ROW EXECUTE FUNCTION public.update_observacao_updated_at();

INSERT INTO public.implementacao_observacoes (implementacao_id, observacao)
SELECT i.id, i.observacoes_gerais
FROM public.implementacoes i
WHERE i.observacoes_gerais IS NOT NULL
  AND TRIM(i.observacoes_gerais) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM public.implementacao_observacoes o
      WHERE o.implementacao_id = i.id
  );
