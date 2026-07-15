type ModuloData = any[] | null | undefined

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
