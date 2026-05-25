DO $$
DECLARE
  rec RECORD;
  i int;
  arr jsonb;
  obj jsonb;
  new_arr jsonb;
BEGIN
  -- Atualiza filiais_detalhes na tabela clientes
  FOR rec IN SELECT id, filiais_detalhes FROM public.clientes WHERE jsonb_typeof(filiais_detalhes) = 'array'
  LOOP
    arr := rec.filiais_detalhes;
    new_arr := '[]'::jsonb;
    FOR i IN 0 .. jsonb_array_length(arr) - 1 LOOP
      obj := arr->i;
      IF NOT obj ? 'nome' THEN
        obj := jsonb_set(obj, '{nome}', '""'::jsonb);
      END IF;
      IF NOT obj ? 'isentar' THEN
        obj := jsonb_set(obj, '{isentar}', 'false'::jsonb);
      END IF;
      new_arr := new_arr || obj;
    END LOOP;
    IF new_arr != arr THEN
      UPDATE public.clientes SET filiais_detalhes = new_arr WHERE id = rec.id;
    END IF;
  END LOOP;

  -- Atualiza filiais_detalhes na tabela crm_propostas
  FOR rec IN SELECT id, filiais_detalhes FROM public.crm_propostas WHERE jsonb_typeof(filiais_detalhes) = 'array'
  LOOP
    arr := rec.filiais_detalhes;
    new_arr := '[]'::jsonb;
    FOR i IN 0 .. jsonb_array_length(arr) - 1 LOOP
      obj := arr->i;
      IF NOT obj ? 'nome' THEN
        obj := jsonb_set(obj, '{nome}', '""'::jsonb);
      END IF;
      IF NOT obj ? 'isentar' THEN
        obj := jsonb_set(obj, '{isentar}', 'false'::jsonb);
      END IF;
      new_arr := new_arr || obj;
    END LOOP;
    IF new_arr != arr THEN
      UPDATE public.crm_propostas SET filiais_detalhes = new_arr WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;
