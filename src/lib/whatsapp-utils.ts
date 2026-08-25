import { MODULES } from '@/constants/contracts'

export const WHATSAPP_PRESENTATION_LINK = 'https://lp-servicelogic-tms.vercel.app/'

export const WHATSAPP_PRESENTATION_MESSAGE = `ola! Conheça a Service Logic | A solução completa para gestão de transportes

${WHATSAPP_PRESENTATION_LINK}`

/**
 * Monta a mensagem de aproximação personalizada para o prospect.
 *
 * - `empresa`: substitui o placeholder "(preencha com o nome da empresa)" pelo
 *   nome da empresa preenchido no formulário de captação. Se vazio, mantém o
 *   fallback "(nome da empresa)".
 *
 * A mensagem é exibida pronta para copiar/editar antes do envio.
 */
export function buildProspectOutreachMessage(empresa?: string | null): string {
  const empresaTrim = empresa && empresa.trim() ? empresa.trim() : ''
  const empresaNome = empresaTrim || '(nome da empresa)'

  return `Olá, tudo bem? 😊
Sou Aline, do comercial da Service Logic.
Estou entrando em contato com a ${empresaNome} porque ajudamos transportadoras a centralizar a operação e, principalmente, a ter mais segurança no dia a dia com emissões fiscais e cumprimento das obrigações relacionadas ao transporte.
Nosso sistema reúne CT-e, MDF-e, documentos fiscais, faturamento, financeiro, controle de viagens, frota e demais processos da operação, evitando que a empresa precise trabalhar com várias ferramentas diferentes.
Além da gestão, acompanhamos as necessidades fiscais e as mudanças na legislação para que o sistema esteja preparado para as exigências do setor.
Queria entender como vocês trabalham hoje: as emissões e a gestão das obrigações fiscais já estão centralizadas em um sistema ou vocês utilizam ferramentas separadas?
Se puder me contar como funciona atualmente, consigo te mostrar onde a Service Logic pode facilitar a rotina da ${empresaNome}`
}

export function cleansePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function isValidBrazilianPhone(phone: string): boolean {
  const digits = cleansePhoneNumber(phone)
  return digits.length >= 10
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const digits = cleansePhoneNumber(phone)
  if (digits.length < 10) return null

  const withCountryCode = digits.startsWith('55') && digits.length > 11 ? digits : `55${digits}`
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${withCountryCode}?text=${encodedMessage}`
}

export interface AtendimentoWhatsAppParams {
  clienteNome: string
  tipoSolicitacao: 'Treinamento' | 'Inclusão de Modulo' | 'Inclusão de Filial' | string
  modulo?: string | null
  filialData?: {
    nome?: string
    cnpj?: string
    dfe_incluso?: boolean
    valor_mensalidade?: string | number
    valor_dfe?: string | number
  } | null
}

export function buildAtendimentoWhatsAppMessage({
  clienteNome,
  tipoSolicitacao,
  modulo,
  filialData,
}: AtendimentoWhatsAppParams): string {
  const nome = (clienteNome || '').trim() || 'Cliente'

  let servicoNome = tipoSolicitacao
  let detalhes = ''
  let valores = ''

  if (tipoSolicitacao === 'Treinamento') {
    servicoNome = 'Treinamento'
    if (modulo && modulo.trim()) {
      detalhes = ` para o módulo *${modulo.trim()}*`
    }
    valores = '• Treinamento — entre em contato para valores e condições'
  } else if (tipoSolicitacao === 'Inclusão de Modulo') {
    servicoNome = 'Inclusão de Módulo'
    if (modulo && modulo.trim()) {
      const cleanMod = modulo.trim()
      detalhes = ` para o módulo *${cleanMod}*`
      const modObj = MODULES.find(
        (m) =>
          m.name.toLowerCase() === cleanMod.toLowerCase() ||
          m.id.toLowerCase() === cleanMod.toLowerCase(),
      )
      if (modObj && typeof modObj.price === 'number') {
        const formattedPrice = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(modObj.price)
        valores = `• Acréscimo mensal: ${formattedPrice}`
      } else {
        valores = '• Acréscimo mensal: a consultar'
      }
    } else {
      valores = '• Acréscimo mensal: a consultar'
    }
  } else if (tipoSolicitacao === 'Inclusão de Filial') {
    servicoNome = 'Inclusão de Filial'
    const filialNome = filialData?.nome ? filialData.nome.trim() : ''
    const filialCnpj = filialData?.cnpj ? filialData.cnpj.trim() : ''
    if (filialNome && filialCnpj) {
      detalhes = ` — Filial *${filialNome}* (CNPJ: ${filialCnpj})`
    } else if (filialNome) {
      detalhes = ` — Filial *${filialNome}*`
    }

    const valMensalidadeNum =
      typeof filialData?.valor_mensalidade === 'number'
        ? filialData.valor_mensalidade
        : parseFloat(String(filialData?.valor_mensalidade || '').replace(',', '.'))
    const formattedMensalidade = !isNaN(valMensalidadeNum)
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          valMensalidadeNum,
        )
      : 'R$ 0,00'

    const lines: string[] = [`• Acréscimo mensal: ${formattedMensalidade}`]

    if (filialData?.dfe_incluso) {
      const valDfeNum =
        typeof filialData?.valor_dfe === 'number'
          ? filialData.valor_dfe
          : parseFloat(String(filialData?.valor_dfe || '').replace(',', '.'))
      const formattedDfe = !isNaN(valDfeNum)
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valDfeNum)
        : 'R$ 0,00'
      lines.push(`• DF-e: ${formattedDfe}`)
    }

    valores = lines.join('\n')
  }

  return `Olá *${nome}*, tudo bem? 😊

Sou da equipe comercial da Service Logic. Registramos sua solicitação de *${servicoNome}*${detalhes}.

*Valores:*
${valores}

*Como funciona:*
Nossa equipe de implantação fará contato para agendar o início do serviço. Após o seu aceite formal (por e-mail ou WhatsApp), iniciamos o processo.

Ficou com alguma dúvida? Estou à disposição!`
}
