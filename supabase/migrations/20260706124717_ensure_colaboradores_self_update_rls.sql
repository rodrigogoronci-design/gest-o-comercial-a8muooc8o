-- Ensure users can SELECT and UPDATE their own colaboradores record
-- Drop existing policies to avoid conflicts, then recreate with proper conditions

DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_update" ON public.colaboradores;

-- Allow authenticated users to read their own colaborador record
CREATE POLICY "colaboradores_select" ON public.colaboradores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow authenticated users to update their own colaborador record
CREATE POLICY "colaboradores_update" ON public.colaboradores
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
