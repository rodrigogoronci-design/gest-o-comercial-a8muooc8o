CREATE TABLE IF NOT EXISTS public.recebimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  razao_social TEXT NOT NULL,
  cnpj TEXT,
  valor_pago NUMERIC NOT NULL,
  valor_titulo NUMERIC NOT NULL,
  data_pagamento DATE NOT NULL,
  arquivo_origem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.recebimentos;
CREATE POLICY "Allow all access to authenticated users" ON public.recebimentos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to anon users" ON public.recebimentos;
CREATE POLICY "Allow all access to anon users" ON public.recebimentos
  FOR ALL TO anon USING (true) WITH CHECK (true);
