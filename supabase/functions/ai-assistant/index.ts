import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    // O openAiKey será usado aqui na Fase 2 da integração de IA
    const openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (action === 'chat') {
      // Esqueleto:
      // 1. Converter mensagem para embedding
      // 2. Buscar no vector DB (knowledge_article_embeddings) via RPC
      // 3. Enviar contexto para a OpenAI e retornar a resposta

      const userMessage = payload?.message || ''
      console.log(`[AI-Assistant] Mensagem recebida: ${userMessage}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Integração OpenAI arquitetada com sucesso.',
          reply:
            'Olá! A infraestrutura para a Inteligência Artificial já está pronta. Quando a chave da OpenAI for ativada, eu serei capaz de fazer buscas semânticas em toda a base de conhecimento e resumir tickets automaticamente!',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'summarize_ticket') {
      console.log(`[AI-Assistant] Solicitado resumo do ticket: ${payload?.ticket_id}`)
      return new Response(
        JSON.stringify({
          success: true,
          summary: 'Resumo automático do ticket gerado pela IA (Placeholder para fase futura).',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (action === 'generate_embedding') {
      console.log(`[AI-Assistant] Solicitado embedding para o artigo: ${payload?.article_id}`)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Estrutura de Geração de Embeddings pronta para uso futuro.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ error: 'Ação não suportada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
