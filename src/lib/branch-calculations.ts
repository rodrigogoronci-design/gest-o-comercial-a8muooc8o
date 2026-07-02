export const BRANCH_PRICE = 199

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.length === 14
}

export function calculateBranchAddendum(
  currentMonthlyValue: number,
  branchCount: number,
  cobrarFiliais: boolean,
): { additionalValue: number; newValue: number } {
  if (!cobrarFiliais || branchCount <= 0) {
    return { additionalValue: 0, newValue: currentMonthlyValue }
  }
  const additionalValue = branchCount * BRANCH_PRICE
  return { additionalValue, newValue: currentMonthlyValue + additionalValue }
}

export function generateBranchItemDescription(nome: string, cnpj: string): string {
  const name = nome || '[Nome da Filial]'
  const formattedCnpj = cnpj || '[CNPJ]'
  return `Referente à inclusão da filial ${name} - CNPJ: ${formattedCnpj}`
}

export function generateBranchesDescription(
  branches: Array<{ nome?: string; cnpj?: string }>,
): string {
  return branches
    .filter((b) => b.cnpj || b.nome)
    .map((b) => generateBranchItemDescription(b.nome || '', b.cnpj || ''))
    .join('\n')
}
