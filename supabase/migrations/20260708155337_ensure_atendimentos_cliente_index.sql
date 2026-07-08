-- Ensure index on atendimentos_clientes(cliente_id) for performance
CREATE INDEX IF NOT EXISTS idx_atendimentos_clientes_cliente_id
  ON public.atendimentos_clientes USING btree (cliente_id);
