import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const action = body.action

    if (action === 'download_and_store') {
      const { sourceUrl, targetPath, contentType } = body
      console.log(`Downloading from: ${sourceUrl}`)
      const resp = await fetch(sourceUrl)
      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to download: status ${resp.status} ${resp.statusText}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      const fileBytes = new Uint8Array(await resp.arrayBuffer())
      console.log(`Downloaded ${fileBytes.length} bytes. Uploading to ${targetPath}...`)

      const { data, error } = await supabase.storage
        .from('via-cargas-anexos')
        .upload(targetPath, fileBytes, {
          contentType:
            contentType || resp.headers.get('content-type') || 'application/octet-stream',
          upsert: true,
        })

      if (error) {
        console.error('Storage upload error:', error)
        return new Response(JSON.stringify({ error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({ success: true, targetPath, bytes: fileBytes.length, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (action === 'test_import_flow') {
      // Step 3 automation runner for verification
      const projetoId = body.projetoId || '4bdc5746-5c78-45e8-9eeb-0870546e6afa'
      const testHash = body.testHash || 'hash-teste-' + Date.now()
      const testFileName = body.fileName || 'relatorio_teste_medicao.pdf'

      // 1. check duplicate
      const { data: existing } = await supabase
        .from('vc_importacoes_relatorios')
        .select('*')
        .eq('projeto_id', projetoId)
        .eq('hash_arquivo', testHash)
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ blockedDuplicate: true, existing }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 2. insert anexo
      const { data: anexo, error: anexoErr } = await supabase
        .from('vc_anexos')
        .insert({
          projeto_id: projetoId,
          storage_path: `VC-OFICIAL/etapa_2/test_${Date.now()}_${testFileName}`,
          nome_original: testFileName,
          tipo_arquivo: 'application/pdf',
          tamanho_bytes: 12345,
          etapa_numero: 2,
          pergunta_ou_item: 'Teste Automatizado Fluxo Importação',
          descricao: 'Registro controlado de teste do fluxo de importação e validação',
          situacao_validacao: 'Armazenado com segurança',
          versao: 1,
          fonte_relacionada: 'Relatório Teste Controlado',
          storage_status: 'armazenado',
        })
        .select()
        .single()

      if (anexoErr) {
        return new Response(JSON.stringify({ error: anexoErr }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 3. insert importacao
      const { data: importacao, error: impErr } = await supabase
        .from('vc_importacoes_relatorios')
        .insert({
          projeto_id: projetoId,
          nome_arquivo: testFileName,
          hash_arquivo: testHash,
          tipo_relatorio: 'PNEUS_PREJUIZOS_BUDINI',
          periodo_identificado: 'Período Teste 2026',
          periodo_parcial: false,
          filial_identificada: 'Filial 0001-59',
          quantidade_registros: 10,
          totais_extraidos: {
            pneusAnalisados: 10,
            prejuizoPotencial: 5000.0,
          },
          inconsistencias: [],
          dados_brutos: { teste: true },
          alteracoes_sugeridas: [
            {
              etapa: 3,
              item: 'Pneus Teste',
              acao: 'Atualizar medição de teste',
              status: 'pendente',
            },
          ],
          etapas_afetadas: [2, 3, 6, 7],
          status_processamento: 'ARQUIVO RECEBIDO',
          storage_path: anexo.storage_path,
          tamanho_bytes: 12345,
          usuario_envio_nome: 'Carlos Moura (Consultor SL Consult)',
          versao_leitura: '1.0',
        })
        .select()
        .single()

      return new Response(
        JSON.stringify({
          success: true,
          anexo,
          importacao,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ message: 'carlos-ops ready' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
