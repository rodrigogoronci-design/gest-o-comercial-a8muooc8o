DO $$
BEGIN
    -- Ensure the authenticated role has full access to the necessary tables 
    -- to update and manage filiais_detalhes, quantidade_filiais, and cobrar_filiais

    DROP POLICY IF EXISTS "clientes_all_authenticated" ON public.clientes;
    CREATE POLICY "clientes_all_authenticated" ON public.clientes
      FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "crm_propostas_all_authenticated" ON public.crm_propostas;
    CREATE POLICY "crm_propostas_all_authenticated" ON public.crm_propostas
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
