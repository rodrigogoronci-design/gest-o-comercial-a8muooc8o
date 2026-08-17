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
