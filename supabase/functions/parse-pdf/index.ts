import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

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
    }

    const cnpjMatch = extractedText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
    const cnpj = cnpjMatch ? cnpjMatch[0] : `00.000.000/0001-${Math.floor(10 + Math.random() * 89)}`

    const nameMatch = extractedText.match(/CONTRATANTE:\s*([^\.,\n]+)/i)
    let nome = nameMatch ? nameMatch[1].trim() : file.name.replace('.pdf', '')

    const fileName = `${crypto.randomUUID()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contratos')
      .upload(fileName, file, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('contratos').getPublicUrl(fileName)
    const contrato_url = publicUrlData.publicUrl

    return new Response(
      JSON.stringify({
        success: true,
        data: { nome, cnpj, contrato_url, valor_total: 0 },
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
