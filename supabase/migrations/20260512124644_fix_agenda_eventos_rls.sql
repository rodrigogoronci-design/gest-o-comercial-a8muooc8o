-- Fix RLS for agenda_eventos and solicitacoes_servico to allow all operations unconditionally
DO $$
BEGIN
  -- agenda_eventos
  DROP POLICY IF EXISTS "agenda_eventos_delete" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_insert" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_select" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_update" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_delete_anon" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_insert_anon" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_select_anon" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_update_anon" ON public.agenda_eventos;
  DROP POLICY IF EXISTS "agenda_eventos_all" ON public.agenda_eventos;

  CREATE POLICY "agenda_eventos_all" ON public.agenda_eventos
    FOR ALL
    USING (true)
    WITH CHECK (true);

  -- solicitacoes_servico
  DROP POLICY IF EXISTS "solicitacoes_servico_delete" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_insert" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_select" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_update" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_delete_anon" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_insert_anon" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_select_anon" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_update_anon" ON public.solicitacoes_servico;
  DROP POLICY IF EXISTS "solicitacoes_servico_all" ON public.solicitacoes_servico;

  CREATE POLICY "solicitacoes_servico_all" ON public.solicitacoes_servico
    FOR ALL
    USING (true)
    WITH CHECK (true);
END $$;
