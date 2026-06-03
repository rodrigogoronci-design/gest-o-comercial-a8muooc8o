import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { to, clientName, contactName, contactPhone, modules, senderName } = body

    const subject = `Agendamento de Treinamentos - ${clientName}`

    const emailBody = `Prezado(a),

Peço, por gentileza, que entre em contato com o cliente abaixo para realizar o agendamento dos treinamentos.

<b>Dados do Cliente</b>

<b>Empresa</b>: ${clientName}
<b>Contato</b>: ${contactName || 'Não informado'}
<b>Telefone</b>: ${contactPhone || 'Não informado'}
<b>Módulos para Treinamento</b>: ${modules || 'Não especificado'}

Após o agendamento, peço a gentileza de nos informar a data e o horário definidos para acompanhamento do processo.

Fico à disposição para quaisquer esclarecimentos.

Atenciosamente,
${senderName}`

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
          to: [to || 'gesualdo@servicelogic.com.br'],
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
