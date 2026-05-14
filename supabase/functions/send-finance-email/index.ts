import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { to, clientName, moduleName, type } = body

    let emailBody = ''
    let subject = 'Documento Solicitado'
    
    if (type === 'proposta_treinamento') {
      subject = 'Proposta de Treinamento'
      emailBody = `Boa tarde, ${clientName || 'Cliente'}!
Conforme alinhado, segue em anexo a proposta referente ao treinamento do ${moduleName || 'Módulo'}.
O treinamento será realizado de forma on-line, ao final, disponibilizaremos também a gravação do treinamento para consulta posterior da equipe.
Assim que recebermos o aceite da proposta, nossa equipe de implantação entrará em contato para verificar a melhor data e horário para realização do treinamento e efetuar o agendamento.
Fico à disposição para quaisquer dúvidas.`
    } else if (type === 'aditivo' || type === 'proposta_upsell') {
      subject = 'Novo Aditivo Contratual'
      emailBody = `Olá ${clientName || 'Cliente'},

Segue o aditivo referente à sua solicitação de novos módulos ou serviços (${moduleName || 'Serviços Adicionais'}).
Por favor, analise as informações descritas e, estando de acordo, podemos seguir com a assinatura eletrônica.

Qualquer dúvida técnica ou comercial, nossa equipe está à disposição.`
    } else {
      emailBody = `Olá ${clientName || 'Cliente'}, segue o documento solicitado.`
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Comercial <onboarding@resend.dev>',
          to: [to || 'financeiro@empresa.com'],
          subject: subject,
          html: `<div style="font-family: sans-serif; color: #333; line-height: 1.6;"><p>${emailBody.replace(/\n/g, '<br/>')}</p></div>`
        })
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Falha no provedor de email: ${err}`)
      }
    } else {
      console.log('Simulando envio de e-mail (RESEND_API_KEY ausente):', {
        to,
        subject,
        body: emailBody
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email enviado com sucesso',
      preview: emailBody 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
