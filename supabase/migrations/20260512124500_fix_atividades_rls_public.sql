-- Enable RLS
ALTER TABLE public.atividades_comerciais ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_select" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_insert" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_update" ON public.atividades_comerciais;
DROP POLICY IF EXISTS "atividades_comerciais_delete" ON public.atividades_comerciais;

-- Create explicit policies for each operation without role restrictions (defaults to public)
CREATE POLICY "atividades_comerciais_select" ON public.atividades_comerciais
  FOR SELECT USING (true);

CREATE POLICY "atividades_comerciais_insert" ON public.atividades_comerciais
  FOR INSERT WITH CHECK (true);

CREATE POLICY "atividades_comerciais_update" ON public.atividades_comerciais
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "atividades_comerciais_delete" ON public.atividades_comerciais
  FOR DELETE USING (true);
