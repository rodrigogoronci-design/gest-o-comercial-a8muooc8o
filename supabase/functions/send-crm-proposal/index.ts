import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Buffer } from 'node:buffer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { to, companyName, contactName, senderName, proposalId, proposalUrl: fallbackUrl, subject: customSubject, message: customMessage } = body

    if (!to) throw new Error('E-mail do destinatário não informado.')

    let actualProposalUrl = fallbackUrl

    if (proposalId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
      const reqAuthHeader = req.headers.get('Authorization')
      
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: reqAuthHeader ? { Authorization: reqAuthHeader } : {} }
      })
      
      const { data: proposal } = await supabase
        .from('crm_propostas')
        .select('documento_url')
        .eq('id', proposalId)
        .single()
      
      if (proposal?.documento_url) {
        actualProposalUrl = proposal.documento_url
      }
    }

    const subject = customSubject || `Proposta Comercial – ${companyName}`
    
    let emailBody = customMessage || `Prezado(a) ${contactName},

Espero que esteja bem.

Conforme alinhado em nossa conversa e apresentação do sistema, segue em anexo a sua proposta comercial com a solução mais adequada para a sua operação.

A cotação foi elaborada com base nas informações levantadas durante nosso atendimento e contempla as melhores condições disponíveis no momento.

Caso tenha qualquer dúvida ou precise de algum ajuste na proposta, estou à disposição para te auxiliar.

Fico no aguardo do seu retorno para darmos sequência.

Atenciosamente,
${senderName || 'Comercial'}`

    const attachments = []

    if (actualProposalUrl) {
      console.log('Fetching attachment from:', actualProposalUrl)
      const fileRes = await fetch(actualProposalUrl)
      if (fileRes.ok) {
        const arrayBuffer = await fileRes.arrayBuffer()
        const content = Buffer.from(arrayBuffer).toString('base64')
        const safeName = companyName.replace(/[^a-z0-9]/gi, '_')
        attachments.push({
          filename: `Proposta_${safeName}.pdf`,
          content: content
        })
      } else {
        console.error('Failed to fetch proposal document:', fileRes.statusText)
        // If we fail to fetch, fallback to including the link
        emailBody += `\n\nLink para a proposta: ${actualProposalUrl}`
      }
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Comercial <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: `<div style="font-family: sans-serif; color: #333; line-height: 1.6;"><p>${emailBody.replace(/\n/g, '<br/>')}</p></div>`,
          attachments: attachments.length > 0 ? attachments : undefined
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Falha no provedor de email: ${err}`)
      }
    } else {
      console.log('Simulando envio de e-mail (RESEND_API_KEY ausente):', {
        to,
        subject,
        body: emailBody,
        attachmentsCount: attachments.length
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso',
        preview: emailBody,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
