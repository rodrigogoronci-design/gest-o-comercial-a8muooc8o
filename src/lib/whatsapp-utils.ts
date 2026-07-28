export const WHATSAPP_PRESENTATION_MESSAGE = `ola! Conheça a Service Logic | A solução completa para gestão de transportes

https://lp-servicelogic-tms.vercel.app/

Salve meu contato: https://gestao-comercial-80c78.goskip.app/vcard/rodrigo`

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
