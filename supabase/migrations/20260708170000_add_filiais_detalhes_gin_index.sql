CREATE INDEX IF NOT EXISTS idx_clientes_filiais_detalhes_gin
ON public.clientes USING gin (filiais_detalhes jsonb_path_ops);
