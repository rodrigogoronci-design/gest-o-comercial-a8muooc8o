DO $$
BEGIN
  -- Remover inserções anteriores para evitar duplicidade em caso de reexecução
  DELETE FROM public.planos_saude WHERE codigo LIKE 'ERP-%' OR codigo LIKE 'MOD-%';

  -- Inserir Módulos ERP (Franquia) e Módulos Adicionais na tabela planos_saude
  INSERT INTO public.planos_saude (id, codigo, descricao, valor_titular, padrao) VALUES
    (gen_random_uuid(), 'ERP-NONE', 'Nenhum (Somente Módulos / Upsell)', 0, false),
    (gen_random_uuid(), 'ERP-TMS-50', 'TMS-50', 399, false),
    (gen_random_uuid(), 'ERP-TMS-100', 'TMS-100', 657, false),
    (gen_random_uuid(), 'ERP-TMS-200', 'TMS-200', 585, false),
    (gen_random_uuid(), 'ERP-TMS-300', 'TMS-300', 877, false),
    (gen_random_uuid(), 'ERP-TMS-500', 'TMS-500', 1097, false),
    (gen_random_uuid(), 'ERP-MTS-1000', 'MTS-1000', 1427, false),
    (gen_random_uuid(), 'ERP-TMS-3000', 'TMS-3000', 1757, false),
    (gen_random_uuid(), 'ERP-TMS-5000', 'TMS-5000', 2087, false),
    (gen_random_uuid(), 'ERP-TMS-5000-PLUS', 'TMS-5000+', 2487, false),
    (gen_random_uuid(), 'MOD-EDI', 'EDI', 250, false),
    (gen_random_uuid(), 'MOD-CTRL-VIAGEM', 'Controle de Viagem', 199, false),
    (gen_random_uuid(), 'MOD-FROTA-10', 'Frota (até 10 placas)', 250, false),
    (gen_random_uuid(), 'MOD-MEDICAO', 'Medição', 350, false),
    (gen_random_uuid(), 'MOD-FRACIONADO', 'Fracionado', 350, false),
    (gen_random_uuid(), 'MOD-TCI-TCE', 'Bloco TCI e TCE (Transportes)', 350, false),
    (gen_random_uuid(), 'MOD-FUNDO-PROT', 'Fundo de proteção', 1201, false),
    (gen_random_uuid(), 'MOD-CALENDARIO', 'Calendário', 165, false),
    (gen_random_uuid(), 'MOD-PAINEL', 'Painel de Informações', 165, false),
    (gen_random_uuid(), 'MOD-FISCAL', 'Fiscal', 199, false),
    (gen_random_uuid(), 'MOD-DFE', 'DF-e', 165, false),
    (gen_random_uuid(), 'MOD-POWER-BI', 'Power BI', 199, false),
    (gen_random_uuid(), 'MOD-SL-TRIP', 'SL-Trip', 299, false),
    (gen_random_uuid(), 'MOD-SL-TRACK', 'SL-Track', 299, false),
    (gen_random_uuid(), 'MOD-HOMOL-BANC', 'Homologação Bancaria', 200, false),
    (gen_random_uuid(), 'MOD-CIOT', 'CIOT', 250, false),
    (gen_random_uuid(), 'MOD-TORRE-CTRL', 'Torre de Controle Logística', 299, false);
END $$;
