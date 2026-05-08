DO $$
DECLARE
  dup RECORD;
  keep_record RECORD;
  del_record RECORD;
  c_old jsonb;
  c_new jsonb;
  merged_cobrancas jsonb;
  new_valor_total numeric;
BEGIN
  -- Identifica clientes duplicados pelo nome normalizado
  FOR dup IN (
    SELECT lower(trim(nome)) as norm_name, array_agg(id ORDER BY created_at ASC) as ids
    FROM public.clientes
    GROUP BY lower(trim(nome))
    HAVING count(*) > 1
  ) LOOP
    -- Mantém o primeiro registro (mais antigo)
    SELECT * INTO keep_record FROM public.clientes WHERE id = dup.ids[1];
    
    FOR i IN 2..array_length(dup.ids, 1) LOOP
      SELECT * INTO del_record FROM public.clientes WHERE id = dup.ids[i];
      
      c_old := COALESCE(keep_record.cobrancas, '[]'::jsonb);
      c_new := COALESCE(del_record.cobrancas, '[]'::jsonb);
      
      -- Agrupa e mescla as cobranças evitando duplicatas exatas de (data_vencimento, valor)
      SELECT COALESCE(jsonb_agg(el), '[]'::jsonb) INTO merged_cobrancas
      FROM (
        SELECT DISTINCT ON (el->>'data_vencimento', el->>'valor') el
        FROM (
          SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(c_old) = 'array' THEN c_old ELSE '[]'::jsonb END) as el
          UNION ALL
          SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(c_new) = 'array' THEN c_new ELSE '[]'::jsonb END) as el
        ) sub_elements
        ORDER BY el->>'data_vencimento', el->>'valor'
      ) unique_elements;
      
      -- Calcula o novo valor total baseado na soma das cobranças mescladas
      SELECT COALESCE(SUM((el->>'valor')::numeric), 0) INTO new_valor_total
      FROM jsonb_array_elements(merged_cobrancas) as el;
      
      -- Se não houver cobranças, usa o maior valor_total entre os dois registros
      IF new_valor_total = 0 THEN
        new_valor_total := GREATEST(COALESCE(keep_record.valor_total, 0), COALESCE(del_record.valor_total, 0));
      END IF;

      -- Atualiza o registro a ser mantido
      UPDATE public.clientes 
      SET 
        cobrancas = merged_cobrancas,
        valor_total = new_valor_total,
        -- Atualiza campos vazios se o registro duplicado tiver a informação
        cnpj = COALESCE(NULLIF(keep_record.cnpj, '00000000000000'), NULLIF(keep_record.cnpj, ''), del_record.cnpj, keep_record.cnpj),
        email = COALESCE(NULLIF(keep_record.email, ''), del_record.email),
        telefone = COALESCE(NULLIF(keep_record.telefone, ''), del_record.telefone)
      WHERE id = keep_record.id;
      
      -- Re-carrega o registro mantido para a próxima iteração
      SELECT * INTO keep_record FROM public.clientes WHERE id = keep_record.id;
      
      -- Remove o registro duplicado
      DELETE FROM public.clientes WHERE id = del_record.id;
    END LOOP;
  END LOOP;
END $$;
