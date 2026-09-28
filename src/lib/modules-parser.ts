type ModuloData = any

/**
 * Expressão regular para identificar CNPJ formatado: XX.XXX.XXX/XXXX-XX
 */
const CNPJ_REGEX = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/

/**
 * Verifica se uma entrada de nome corresponde a um módulo real do sistema
 * e NÃO a uma filial ou contador de filiais registrado no cadastro.
 *
 * Descarta:
 * - Começa com "Filial" (ex: "Filial: MOVEX TRANSPORTES...", "Filiais Adicionais (Qtd: 1)", "Filial Adicional", etc.)
 * - Contém CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 * - Seja contador/quantidade de filiais (contém "Qtd:" e/ou "Filiais Adicionais")
 * - Texto descritivo de aditivo de filial (ex: "inclusão de uma nova filial", "inclusão do DF-e para a filial")
 */
export function isModuloReal(nome: string | null | undefined): boolean {
  if (!nome || typeof nome !== 'string') return false
  const trimmed = nome.trim()
  if (!trimmed) return false

  const lower = trimmed.toLowerCase()

  // 1. Começa com Filial / Filiais (ex.: "Filial: ...", "Filiais Adicionais ...", "Filial Adicional")
  if (lower.startsWith('filial')) {
    return false
  }

  // 2. Contém CNPJ formatado (ex: "67.081.546/0002-76")
  if (CNPJ_REGEX.test(trimmed)) {
    return false
  }

  // 3. Contador ou quantidade de filiais
  if (lower.includes('filiais adicionais') || lower.includes('filial adicional')) {
    return false
  }
  if (lower.includes('qtd:') && lower.includes('filia')) {
    return false
  }

  // 4. Frases descritivas de aditivo de filiais
  if (
    lower.includes('inclusão de uma nova filial') ||
    lower.includes('inclusao de uma nova filial')
  ) {
    return false
  }
  if (lower.includes('para a filial') || lower.includes('para filial')) {
    return false
  }

  return true
}

export function parseModulosToList(modulos: ModuloData): string[] {
  if (!modulos) return []

  const extractName = (m: any): string | null => {
    if (typeof m === 'string') return m.trim() || null
    if (typeof m === 'number') return String(m)
    if (typeof m === 'object' && m !== null) {
      if (m.selected === false || m.ativo === false || m.active === false) return null
      return m.nome || m.name || m.label || m.descricao || m.titulo || null
    }
    return null
  }

  let parsed: any = modulos
  if (typeof modulos === 'string') {
    try {
      parsed = JSON.parse(modulos)
    } catch {
      return modulos
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map(extractName).filter((s): s is string => Boolean(s))
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const objKeys = Object.keys(parsed)
    if (
      objKeys.some((k) => typeof parsed[k] === 'boolean') &&
      !parsed.plano_base &&
      !Array.isArray(parsed.adicionais)
    ) {
      return objKeys
        .filter((k) => parsed[k] === true)
        .map((k) => k.trim())
        .filter(Boolean)
    }
    if (Array.isArray(parsed.adicionais)) {
      return parsed.adicionais.map(extractName).filter((s): s is string => Boolean(s))
    }
  }

  return []
}
