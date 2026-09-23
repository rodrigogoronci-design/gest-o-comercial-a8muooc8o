-- Migration: Correção de valores dos planos ERP - TMS 100 para R$ 657,00 e TMS 200 para R$ 757,00
-- Totalmente aditiva e idempotente: apenas UPDATE de valores no catálogo de planos
-- Restrições: sem alteração de valor_total de clientes, sem mexer em atendimentos_clientes, sem alterar Patrimônio

UPDATE public.planos_saude
SET valor_titular = 657.00
WHERE codigo = 'ERP-TMS-100';

UPDATE public.planos_saude
SET valor_titular = 757.00
WHERE codigo = 'ERP-TMS-200';
