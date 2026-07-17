import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
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
    const { to, clientName, repName, signatureLink, contractUrl } = body

    if (!to) throw new Error('E-mail do destinatário não informado.')
    if (!signatureLink) throw new Error('Link de assinatura não informado.')

    const subject = `Contrato Service Logic - ${clientName}`

    const emailBody = `Boa tarde, ${clientName} conforme contrato

Seja muito bem-vindos à Service Logic!

Conforme alinhado, segue abaixo o link para assinatura eletrônica do contrato referente à contratação do sistema TMS Service Logic.

O contrato deverá ser assinado pelo representante legal da empresa, ${repName || 'conforme contrato'}, e também em anexo.

Link para assinatura:
${signatureLink}

Após a assinatura do contrato, daremos início ao processo de implantação do sistema, que será conduzido nas seguintes etapas:

1. Pré-Implantação (Handover Comercial)
2. Implantação Inicial (Reunião de Kick-off)
3. Ciclo de Treinamentos
4. Operação Assistida
5. Encerramento da Implantação

O cronograma estimado é de aproximadamente 8 semanas, distribuídas da seguinte forma:

- Semana 1: Pré-Implantação — Alinhamento interno, handover comercial e parametrização inicial do sistema.
- Semana 1 a 2: Implantação Inicial — Reunião de Kick-off com o cliente, apresentação da equipe e definição do cronograma detalhado.
- Semana 2 a 4: Ciclo de Treinamentos — Treinamentos dos módulos contratados, com gravações disponibilizadas para consulta posterior da equipe.
- Semana 4 a 6: Operação Assistida — Acompanhamento da operação real, suporte dedicado e ajustes finais de configuração.
- Semana 6 a 8: Encerramento da Implantação — Revisão final, transição para o suporte oficial e encerramento formal do projeto.

Estamos à disposição para quaisquer esclarecimentos.

Atenciosamente,
Equipe Comercial - Service Logic`

    const attachments: { filename: string; content: string }[] = []

    if (contractUrl) {
      console.log('Fetching contract attachment from:', contractUrl)
      const fileRes = await fetch(contractUrl)
      if (fileRes.ok) {
        const arrayBuffer = await fileRes.arrayBuffer()
        const content = Buffer.from(arrayBuffer).toString('base64')
        const safeName = (clientName || 'cliente').replace(/[^a-z0-9]/gi, '_')
        attachments.push({
          filename: `Contrato_${safeName}.pdf`,
          content: content,
        })
      } else {
        console.error('Failed to fetch contract document:', fileRes.statusText)
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
