import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Buffer } from 'node:buffer'
import pdf from 'npm:pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) throw new Error('Nenhum arquivo enviado.')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    let extractedText = ''
    try {
      const data = await pdf(Buffer.from(buffer))
      extractedText = data.text
    } catch (e) {
      console.error('Error parsing PDF', e)
      throw new Error('Falha ao extrair texto do PDF.')
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
