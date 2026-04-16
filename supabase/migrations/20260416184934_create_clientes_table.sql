CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    modulos JSONB DEFAULT '[]'::jsonb,
    valor_total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to anon users" ON public.clientes;
CREATE POLICY "Allow all access to anon users" ON public.clientes
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.clientes;
CREATE POLICY "Allow all access to authenticated users" ON public.clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
