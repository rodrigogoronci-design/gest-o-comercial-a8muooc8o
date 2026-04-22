import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import * as XLSX from 'npm:xlsx@0.18.5'

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

    if (!file) {
      throw new Error('Nenhum arquivo enviado.')
    }

    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Arquivo vazio.')
    }

    const uint8Array = new Uint8Array(arrayBuffer)

    let workbook
    const result: any = {}

    try {
      workbook = XLSX.read(uint8Array, {
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false,
      })

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          blankrows: false,
          raw: true,
        })
        result[sheetName] = rows
      }
    } catch (parseError) {
      console.error('XLSX parse error', parseError)
      throw new Error(
        'Falha ao decodificar o arquivo Excel (binário): ' + (parseError as Error).message,
      )
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
