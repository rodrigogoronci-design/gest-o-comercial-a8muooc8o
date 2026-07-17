export function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11)
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cleaned[10])) return false

  return true
}

export function formatCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 14)
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleaned)) return false

  const calc = (len: number) => {
    const weights =
      len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const slice = cleaned.slice(0, len)
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(slice[i]) * weights[i]
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }

  return calc(12) === parseInt(cleaned[12]) && calc(13) === parseInt(cleaned[13])
}

export function composeEndereco(fields: {
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
}): string {
  const parts: string[] = []
  if (fields.logradouro) parts.push(fields.logradouro)
  if (fields.numero) parts.push(fields.numero)
  if (fields.complemento) parts.push(fields.complemento)
  if (fields.bairro) parts.push(fields.bairro)
  if (fields.cidade) parts.push(fields.cidade)
  if (fields.estado) parts.push(fields.estado)
  if (fields.cep) parts.push(`CEP: ${fields.cep}`)
  return parts.join(', ')
}
