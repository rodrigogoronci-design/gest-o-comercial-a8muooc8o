-- SECURITY DEFINER function to get current user's role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.colaboradores WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- colaboradores: restrict Implantação users to own profile
-- =====================================================
DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;
CREATE POLICY "colaboradores_select" ON public.colaboradores
  FOR SELECT TO authenticated
  USING (
    public.get_current_user_role() IS DISTINCT FROM 'Implantação'
    OR user_id = auth.uid()
  );

-- =====================================================
-- recebimentos: deny access to Implantação role
-- =====================================================
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.recebimentos;
DROP POLICY IF EXISTS "Allow all access to anon users" ON public.recebimentos;
CREATE POLICY "recebimentos_authenticated" ON public.recebimentos
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IS DISTINCT FROM 'Implantação')
  WITH CHECK (public.get_current_user_role() IS DISTINCT FROM 'Implantação');

-- =====================================================
-- crm_propostas: deny access to Implantação role
-- =====================================================
DROP POLICY IF EXISTS "Allow SELECT to anon users" ON public.crm_propostas;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.crm_propostas;
DROP POLICY IF EXISTS "crm_propostas_all_authenticated" ON public.crm_propostas;
DROP POLICY IF EXISTS "crm_propostas_delete" ON public.crm_propostas;
DROP POLICY IF EXISTS "crm_propostas_insert" ON public.crm_propostas;
DROP POLICY IF EXISTS "crm_propostas_select" ON public.crm_propostas;
DROP POLICY IF EXISTS "crm_propostas_update" ON public.crm_propostas;
CREATE POLICY "crm_propostas_authenticated" ON public.crm_propostas
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IS DISTINCT FROM 'Implantação')
  WITH CHECK (public.get_current_user_role() IS DISTINCT FROM 'Implantação');

-- =====================================================
-- crm_prospects: deny access to Implantação role
-- =====================================================
DROP POLICY IF EXISTS "Allow all access to anon users" ON public.crm_prospects;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_update_authenticated" ON public.crm_prospects;
CREATE POLICY "crm_prospects_authenticated" ON public.crm_prospects
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IS DISTINCT FROM 'Implantação')
  WITH CHECK (public.get_current_user_role() IS DISTINCT FROM 'Implantação');

-- =====================================================
-- atividades_comerciais: deny access to Implantação role
-- =====================================================
DROP POLICY IF EXISTS "atividades_comerciais_delete" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_delete_anon" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_insert" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_insert_anon" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_select" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_select_anon" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_update" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_update_anon" ON public.atividades_comerciais;
CREATE POLICY "atividades_comerciais_authenticated" ON public.atividades_comerciais
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IS DISTINCT FROM 'Implantação')
  WITH CHECK (public.get_current_user_role() IS DISTINCT FROM 'Implantação');

-- =====================================================
-- solicitacoes_servico: deny access to Implantação role
-- =====================================================
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.solicitacoes_servico;
CREATE POLICY "solicitacoes_servico_authenticated" ON public.solicitacoes_servico
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IS DISTINCT FROM 'Implantação')
  WITH CHECK (public.get_current_user_role() IS DISTINCT FROM 'Implantação');

-- =====================================================
-- implementacoes & implementacao_etapas: ensure access for Implantação role
-- (existing policies already allow ALL to authenticated, which includes Implantação users)
-- Re-affirm policies to be safe
-- =====================================================
ALTER TABLE public.implementacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementacao_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "implementacoes_all" ON public.implementacoes;
CREATE POLICY "implementacoes_all" ON public.implementacoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "implementacao_etapas_all" ON public.implementacao_etapas;
CREATE POLICY "implementacao_etapas_all" ON public.implementacao_etapas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
