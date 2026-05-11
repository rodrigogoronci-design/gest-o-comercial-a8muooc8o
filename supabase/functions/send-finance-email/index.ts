import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clienteNome, clienteCnpj, servico, valor, mesCompetencia, mesVencimento, detalhes } =
      await req.json()

    const emailContent = `
Boa tarde, Sr Israel

Gostaria de solicitar a inclusão da cobrança mensal referente ao serviço de ${servico}, conforme proposta comercial enviada ao cliente ${clienteNome} ${clienteCnpj}. 

Valor aprovado: ${valor}
${detalhes ? `\nDetalhes: ${detalhes}\n` : ''}
Peço, por gentileza, que a cobrança seja configurada em formato recorrente conforme padrão contratual e vinculada ao cadastro do cliente.

Mês de Competência : ${mesCompetencia}

Mês de Vencimento : ${mesVencimento}

Fico à disposição para qualquer informação adicional.

Atenciosamente,
Equipe Comercial
`
    // Simulando o envio de e-mail através de logging (na infraestrutura real, integraríamos Resend, SendGrid, etc.)
    console.log('--- INÍCIO: ENVIANDO E-MAIL PARA O FINANCEIRO ---')
    console.log(emailContent)
    console.log('--- FIM: E-MAIL PARA O FINANCEIRO ---')

    return new Response(
      JSON.stringify({ success: true, message: 'E-mail enviado com sucesso (simulação)' }),
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
