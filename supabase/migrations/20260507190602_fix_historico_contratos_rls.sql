-- Remover políticas antigas restritas
DROP POLICY IF EXISTS "authenticated_select" ON public.historico_contratos;
DROP POLICY IF EXISTS "authenticated_insert" ON public.historico_contratos;
DROP POLICY IF EXISTS "authenticated_update" ON public.historico_contratos;
DROP POLICY IF EXISTS "authenticated_delete" ON public.historico_contratos;

-- Adicionar políticas que permitem acesso para anon e authenticated (mesmo padrão da tabela clientes)
DROP POLICY IF EXISTS "Allow all access to anon users" ON public.historico_contratos;
CREATE POLICY "Allow all access to anon users" ON public.historico_contratos
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.historico_contratos;
CREATE POLICY "Allow all access to authenticated users" ON public.historico_contratos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
