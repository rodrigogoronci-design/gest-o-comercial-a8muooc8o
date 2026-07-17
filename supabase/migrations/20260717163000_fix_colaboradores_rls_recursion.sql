-- Resolve infinite recursion on colaboradores table policies
-- This prevents the "Erro: infinite recursion detected in policy for relation 'colaboradores'" 
-- that happens when a policy queries the same table to check rules.

DROP POLICY IF EXISTS "colaboradores_all" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_insert" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_update" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_delete" ON public.colaboradores;

-- Everyone authenticated needs to see the collaborators (for assignments, lists, tracking, etc)
CREATE POLICY "colaboradores_select" ON public.colaboradores
    FOR SELECT TO authenticated USING (true);

-- A user can update their own record
CREATE POLICY "colaboradores_update" ON public.colaboradores
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Allow insertions (useful for automations/triggers that link auth users to colaboradores)
CREATE POLICY "colaboradores_insert" ON public.colaboradores
    FOR INSERT TO authenticated WITH CHECK (true);

-- Restrict deletions to prevent accidental drops
CREATE POLICY "colaboradores_delete" ON public.colaboradores
    FOR DELETE TO authenticated USING (false);
