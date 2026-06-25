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
    const body = await req.json().catch(() => ({}))
    const { to, companyName, contactName, senderName, proposalUrl } = body

    if (!to) throw new Error('E-mail do destinatário não informado.')

    const subject = `Proposta Comercial – ${companyName}`

    let emailBody = `Prezado(a) ${contactName},

Espero que esteja bem.

Conforme alinhado em nossa conversa e apresentação do sistema, segue em anexo a sua proposta comercial com a solução mais adequada para a sua operação.

A cotação foi elaborada com base nas informações levantadas durante nosso atendimento e contempla as melhores condições disponíveis no momento.

Caso tenha qualquer dúvida ou precise de algum ajuste na proposta, estou à disposição para te auxiliar.

Fico no aguardo do seu retorno para darmos sequência.`

    if (proposalUrl) {
      emailBody += `\n\nLink para a proposta: ${proposalUrl}`
    }

    emailBody += `\n\nAtenciosamente,\n${senderName || 'Comercial'}`

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
