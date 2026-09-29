import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Buffer } from 'node:buffer'

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
    const body = await req.json().catch(() => ({}))
    const {
      to,
      companyName,
      contactName,
      senderName,
      proposalId,
      proposalUrl: fallbackUrl,
      subject: customSubject,
      message: customMessage,
    } = body

    if (!to) throw new Error('E-mail do destinatário não informado.')

    let actualProposalUrl = fallbackUrl

    if (proposalId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
      const reqAuthHeader = req.headers.get('Authorization')

      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: reqAuthHeader ? { Authorization: reqAuthHeader } : {} },
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

    let emailBody =
      customMessage ||
      `Olá, ${contactName}

Conforme nossa conversa, encaminho em anexo a proposta comercial da Service Logic, elaborada de acordo com as necessidades apresentadas pela ${companyName}

Nossa solução foi desenvolvida para proporcionar mais controle, agilidade e segurança na gestão da transportadora, integrando os processos operacionais, financeiros, fiscais e logísticos em uma única plataforma.

Na proposta você encontrará todos os detalhes da solução, os módulos contemplados, valores e as condições comerciais. Caso tenha qualquer dúvida ou deseje analisar algum ponto em conjunto, estarei à disposição para apresentar a proposta e esclarecer todas as informações necessárias.

Após a aprovação, seguiremos com as próximas etapas, que incluem a assinatura eletrônica do contrato, envio da documentação, parametrização do sistema, treinamentos e acompanhamento da implantação até o início da operação.

Agradeço pela oportunidade e fico no aguardo do seu retorno.

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
          content: content,
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
          attachments: attachments.length > 0 ? attachments : undefined,
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
        attachmentsCount: attachments.length,
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
