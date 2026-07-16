import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { Buffer } from 'node:buffer'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { to, clientName, repName, signatureLink, contractUrl } = body

    if (!to) throw new Error('E-mail do destinatário não informado.')

    const subject = `Bem-vindo à Service Logic - Contrato para Assinatura - ${clientName}`

    const emailBody = `Boa tarde, ${clientName} conforme contrato  

Seja muito bem-vindos à Service Logic!
Conforme alinhado, segue abaixo o link para assinatura eletrônica do contrato referente à contratação do sistema TMS Service Logic.
O contrato deverá ser assinado pela representante legal da empresa a ${repName || 'representante legal'}

Link para assinatura:
${signatureLink || '[Link não disponível]'}

Após a assinatura do contrato, daremos início ao processo de implantação do sistema, que será conduzido nas seguintes etapas:
1. Pré-Implantação (Handover Comercial)
Alinhamento do escopo, validação das informações comerciais e preparação da documentação necessária para o início do projeto.
2. Implantação Inicial (Reunião de Kick-off)
Reunião de abertura para apresentação da equipe, alinhamento das atividades, parametrização inicial do sistema e liberação dos acessos.
3. Ciclo de Treinamentos
Capacitação dos usuários para utilização dos módulos contratados, garantindo o correto uso da plataforma.
4. Operação Assistida
Período em que a equipe já inicia a operação no sistema com acompanhamento do analista de implantação, assegurando uma transição segura e eficiente.
5. Encerramento da Implantação
Validação final do projeto, assinatura do Termo de Encerramento e transição oficial para a equipe de Suporte.

Prazo médio de implantação
O cronograma padrão é de aproximadamente 8 semanas, podendo variar conforme a complexidade da operação e o escopo contratado.
Semana 1: Kick-off e parametrização;
Semanas 2 e 3: Treinamentos;
Semanas 4 a 7: Operação assistida;
Semana 8: Encerramento da implantação.

Permanecemos à disposição para quaisquer esclarecimentos e esperamos iniciar essa parceria em breve.`

    const attachments = []

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
          html: `<div style="font-family: sans-serif; color: #333; line-height: 1.6; white-space: pre-wrap;">${emailBody.replace(/\n/g, '<br/>')}</div>`,
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
