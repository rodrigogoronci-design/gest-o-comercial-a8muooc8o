export const WHATSAPP_PRESENTATION_MESSAGE =
  'Olá! Segue o link da apresentação: https://lp-servicelogic-tms.vercel.app/'

export const PRESENTATION_LINK = 'https://lp-servicelogic-tms.vercel.app/'

export function cleansePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function formatBrazilianWhatsAppNumber(phone: string): string {
  const digits = cleansePhoneNumber(phone)
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits
  }
  return `55${digits}`
}

export function isValidBrazilianPhone(phone: string): boolean {
  const digits = cleansePhoneNumber(phone)
  return digits.length >= 10
}

export function buildWhatsAppUrl(
  phone: string,
  message: string = WHATSAPP_PRESENTATION_MESSAGE,
): string | null {
  const digits = cleansePhoneNumber(phone)
  if (digits.length < 10) return null
  const formatted = formatBrazilianWhatsAppNumber(phone)
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(
  phone: string,
  message: string = WHATSAPP_PRESENTATION_MESSAGE,
): boolean {
  const url = buildWhatsAppUrl(phone, message)
  if (!url) return false
  window.open(url, '_blank')
  return true
}
