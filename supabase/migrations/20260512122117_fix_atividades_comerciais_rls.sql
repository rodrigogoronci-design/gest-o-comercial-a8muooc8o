-- Enable RLS
ALTER TABLE public.atividades_comerciais ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_select" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_insert" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_update" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_delete" ON public.atividades_comerciais;

-- Create explicit policies for each operation
CREATE POLICY "atividades_comerciais_select" ON public.atividades_comerciais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "atividades_comerciais_insert" ON public.atividades_comerciais
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "atividades_comerciais_update" ON public.atividades_comerciais
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "atividades_comerciais_delete" ON public.atividades_comerciais
  FOR DELETE TO authenticated USING (true);
