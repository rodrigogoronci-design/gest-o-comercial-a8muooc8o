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
    
    if (type === 'proposta_treinamento') {
      emailBody = `Boa tarde, ${clientName || 'Cliente'}!
Conforme alinhado, segue em anexo a proposta referente ao treinamento do ${moduleName || 'Módulo'}.
O treinamento será realizado de forma on-line, ao final, disponibilizaremos também a gravação do treinamento para consulta posterior da equipe.
Assim que recebermos o aceite da proposta, nossa equipe de implantação entrará em contato para verificar a melhor data e horário para realização do treinamento e efetuar o agendamento.
Fico à disposição para quaisquer dúvidas.`
    } else {
      emailBody = `Olá ${clientName || 'Cliente'}, segue o documento solicitado.`
    }

    // Email sending logic would go here (e.g. Resend, SendGrid)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email sent successfully',
      preview: emailBody 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
