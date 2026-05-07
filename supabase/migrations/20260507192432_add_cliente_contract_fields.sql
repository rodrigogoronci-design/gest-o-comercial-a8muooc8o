ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS rep_nome TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS rep_cpf TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS rep_rg TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS valor_implantacao NUMERIC DEFAULT 0;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS modo_implantacao TEXT DEFAULT 'remoto';
