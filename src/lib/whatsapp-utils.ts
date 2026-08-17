export const WHATSAPP_PRESENTATION_LINK = 'https://lp-servicelogic-tms.vercel.app/'

export const WHATSAPP_PRESENTATION_MESSAGE = `ola! Conheça a Service Logic | A solução completa para gestão de transportes

${WHATSAPP_PRESENTATION_LINK}`

/**
 * Segmento padrão usado quando o prospect não possui segmento cadastrado.
 */
export const DEFAULT_PROSPECT_SEGMENTO = 'transporte e logística'

/**
 * Monta a mensagem de aproximação personalizada para o prospect, substituindo
 * o placeholder [SEGMENTO] pelo segmento cadastrado (ou pelo padrão).
 *
 * A mensagem é exibida pronta para copiar/editar antes do envio, por isso o
 * parâmetro `segmento` já deve estar normalizado pelo chamador quando quiser
 * usar o padrão — aqui apenas aplicamos o fallback caso venha vazio.
 */
export function buildProspectOutreachMessage(segmento?: string | null): string {
  const segmentoFinal = segmento && segmento.trim() ? segmento.trim() : DEFAULT_PROSPECT_SEGMENTO
  return `Olá, tudo bem? 😊

Meu nome é Aline e faço parte do comercial da Service Logic.

Entrei em contato porque estamos conversando com empresas do segmento de ${segmentoFinal} que buscam melhorar o controle da operação, financeiro e faturamento.

Queria entender rapidamente como vocês fazem essa gestão hoje e apresentar nossa solução, caso faça sentido para a empresa.

Posso falar com você sobre isso?`
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
