import logoUrl from '@/assets/logomarca-service-ea011.png'

/**
 * ============================================================================
 *  HANDOVER COMERCIAL → EXECUÇÃO — Gerador de PDF/HTML executivo
 * ============================================================================
 *  Identidade visual Service Logic:
 *    - Fonte: Times New Roman
 *    - Laranja institucional: #f37021
 *    - Azul institucional:     #1b4382
 *
 *  Estrutura do documento:
 *    1) CAPA EXECUTIVA  (primeira página, page-break-after: always)
 *    2) SUMÁRIO AUTOMÁTICO (segunda página, com títulos extraídos do conteúdo)
 *    3) CONTEÚDO  (cabeçalho/rodapé nas páginas internas)
 *
 *  Parser de markdown avançado (renderHandoverMarkdown):
 *    - Títulos #, ##, ###, ####  (com h1 renderizado como seção principal)
 *    - Subtítulos numerados: 1.1, 1.2, 4.1.1 (preservados como h3/h4)
 *    - Listas com bullets: -, *, •
 *    - Listas numeradas: 1., 2., a), b)
 *    - Listas aninhadas (indentação por espaços)
 *    - Negrito **texto**
 *    - Itálico *texto* ou _texto_
 *    - Parágrafos
 *    - Linhas horizontais --- ou ***
 *    - Citações/blockquote > texto
 *    - Tabelas markdown (pipe tables)
 *    - Fluxos visuais: A → B → C (caixas conectadas por setas)
 *    - Correção automática de numeração quando TODAS as seções de nível 1
 *      começam com "1." (renumeradas sequencialmente 1., 2., 3.)
 *    - Destaques visuais por palavras-chave no título:
 *        * Condições Comerciais / Valores / Investimento  (caixa laranja)
 *        * Pontos de Atenção / Riscos / Alertas             (caixa âmbar + ⚠)
 *        * Próximos Passos                                  (checklist ☐)
 *        * Status da Passagem Comercial                      (quadro-resumo)
 * ============================================================================
 */

/** Status code → exibição humanizada (NUNCA mostrar códigos internos). */
const STATUS_HUMANIZADO: Record<string, string> = {
  consultoria_recebido: 'Consultoria Recebida',
  em_execucao: 'Em Execução',
  concluida: 'Concluída',
  pendente: 'Pendente',
  finalizada: 'Finalizada',
  'em andamento': 'Em Andamento',
}

function humanizarStatus(status: string | null | undefined): string {
  if (!status) return '—'
  const s = String(status).trim()
  if (STATUS_HUMANIZADO[s.toLowerCase()]) return STATUS_HUMANIZADO[s.toLowerCase()]!
  // capitaliza o primeiro caractere
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Aplica formatação inline (negrito, itálico). O texto já está escapado.
 * Ordem importa: negrito primeiro (usa **), depois itálico (* ou _).
 */
function applyInline(text: string): string {
  let out = text
  // Negrito: **texto** ou __texto__
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>')
  // Itálico: *texto* ou _texto_ (não começa com **)
  out = out.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>')
  return out
}

// ---------------------------------------------------------------------------
//  Utilitários de detecção de palavras-chave
// ---------------------------------------------------------------------------

const KEYWORDS_CONDICOES = [
  'condição',
  'condições',
  'valor',
  'valores',
  'investimento',
  'comercial',
  'preço',
  'preços',
  'mensalidade',
]
const KEYWORDS_ATENCAO = [
  'pontos de atenção',
  'ponto de atenção',
  'risco',
  'riscos',
  'alerta',
  'alertas',
  'atenção',
  'cuidado',
  'cuidados',
]
const KEYWORDS_PROXIMOS = ['próximos passos', 'próximo passo', 'ações', 'ação', 'next steps']
const KEYWORDS_STATUS = ['status da passagem', 'passagem comercial', 'status do handover']

function matchKeyword(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

/** Conta espaços de indentação de uma linha (para listas aninhadas). */
function indentLevel(line: string): number {
  const m = line.match(/^(\s*)/)
  const spaces = m ? m[1].replace(/\t/g, '  ').length : 0
  // cada nível = 2 espaços (ou 1 tab)
  return Math.floor(spaces / 2)
}

// ---------------------------------------------------------------------------
//  Correção automática de numeração
// ---------------------------------------------------------------------------

interface HeadingInfo {
  raw: string // texto sem o prefixo #
  level: 1 | 2 | 3 | 4
  originalNumber: string | null // ex: "1." ou "1.1" se já vier numerado
  index: number // posição no array de headings
}

/**
 * Extrai a lista de headings (h1/h2/h3/h4) do markdown, detectando o padrão
 * "# texto" ou "1. texto" / "1.1 texto" (subtítulos numerados sem #).
 */
function extractHeadings(md: string): { lineIdx: number; heading: HeadingInfo }[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const result: { lineIdx: number; heading: HeadingInfo }[] = []
  let counter = 0
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trimEnd()
    if (!raw.trim()) continue
    const h4 = raw.match(/^####\s+(.*)$/)
    const h3 = raw.match(/^###\s+(.*)$/)
    const h2 = raw.match(/^##\s+(.*)$/)
    const h1 = raw.match(/^#\s+(.*)$/)
    if (h1) {
      const heading: HeadingInfo = {
        raw: h1[1].trim(),
        level: 1,
        originalNumber: extractLeadingNumber(h1[1]),
        index: counter++,
      }
      result.push({ lineIdx: i, heading })
    } else if (h2) {
      const heading: HeadingInfo = {
        raw: h2[1].trim(),
        level: 2,
        originalNumber: extractLeadingNumber(h2[1]),
        index: counter++,
      }
      result.push({ lineIdx: i, heading })
    } else if (h3) {
      const heading: HeadingInfo = {
        raw: h3[1].trim(),
        level: 3,
        originalNumber: extractLeadingNumber(h3[1]),
        index: counter++,
      }
      result.push({ lineIdx: i, heading })
    } else if (h4) {
      const heading: HeadingInfo = {
        raw: h4[1].trim(),
        level: 4,
        originalNumber: extractLeadingNumber(h4[1]),
        index: counter++,
      }
      result.push({ lineIdx: i, heading })
    } else {
      // subtítulo numerado sem # (ex: "1.1 Objetivo", "4.1.1 Escopo")
      // só consideramos se começar com número seguido de ponto e tiver texto
      const numOnly = raw.match(/^(\d+(?:\.\d+)+)\s+(.+)$/)
      if (numOnly && !lines[i].match(/^[-*•]/)) {
        const heading: HeadingInfo = {
          raw: raw,
          level: 3, // subtítulos numerados viram h3 por padrão
          originalNumber: numOnly[1],
          index: counter++,
        }
        result.push({ lineIdx: i, heading })
      }
    }
  }
  return result
}

/** Extrai número inicial "1." ou "1.1" de um título, se existir. */
function extractLeadingNumber(text: string): string | null {
  const m = text.match(/^(\d+(?:\.\d+)*)\.?\s+/)
  return m ? m[1] : null
}

/**
 * Decide se deve renumerar os headings de nível 1.
 * Regra: se TODOS os headings de nível 1 começam com "1." (ou "1"),
 * renumerar sequencialmente. Caso contrário, preservar.
 */
function shouldRenumberLevel1(headings: HeadingInfo[]): boolean {
  const level1 = headings.filter((h) => h.level === 1)
  if (level1.length < 2) return false
  // Verifica se TODOS começam com "1" (ou "1.")
  const allStartWithOne = level1.every((h) => {
    if (!h.originalNumber) return false
    const firstPart = h.originalNumber.split('.')[0]
    return firstPart === '1'
  })
  return allStartWithOne
}

/**
 * Constrói um mapa: lineIdx → novo número (ex: "1", "2", "1.1", "2.1").
 * Aplica renumeração somente quando detectado o padrão "todas começam com 1.".
 * Subseções recebem numeração hierárquica baseada no nível 1 atual.
 */
function buildRenumberMap(
  headings: { lineIdx: number; heading: HeadingInfo }[],
): Map<number, string> {
  const map = new Map<number, string>()
  if (headings.length === 0) return map

  const renumberLevel1 = shouldRenumberLevel1(headings.map((h) => h.heading))
  let lvl1Counter = 0
  let lvl2Counter = 0
  let lvl3Counter = 0

  for (const { lineIdx, heading } of headings) {
    let newNumber: string | null = null
    if (heading.level === 1) {
      if (renumberLevel1) {
        lvl1Counter++
        lvl2Counter = 0
        lvl3Counter = 0
        newNumber = String(lvl1Counter)
      } else {
        // preservar número original se existir, senão incrementar
        if (heading.originalNumber) {
          // se já numerado corretamente (1,2,3) preservar
          newNumber = heading.originalNumber
        }
      }
    } else if (heading.level === 2) {
      if (renumberLevel1 || heading.originalNumber) {
        lvl2Counter++
        lvl3Counter = 0
        const parent = lvl1Counter > 0 ? lvl1Counter : 1
        newNumber = heading.originalNumber || `${parent}.${lvl2Counter}`
      }
    } else if (heading.level === 3) {
      if (renumberLevel1 || heading.originalNumber) {
        lvl3Counter++
        const parent = lvl1Counter > 0 ? lvl1Counter : 1
        const sub = lvl2Counter > 0 ? lvl2Counter : 1
        newNumber = heading.originalNumber || `${parent}.${sub}.${lvl3Counter}`
      }
    }
    if (newNumber) map.set(lineIdx, newNumber)
  }
  return map
}

// ---------------------------------------------------------------------------
//  Parser de markdown → HTML
// ---------------------------------------------------------------------------

/** Verifica se a linha é um separador de tabela markdown (|---|---|). */
function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(line) && line.includes('-')
}

/** Verifica se a linha é uma linha de tabela (contém |). */
function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.includes('|') && trimmed.length > 0
}

/** Parseia uma tabela markdown em HTML. */
function parseTable(lines: string[], startIdx: number): { html: string; nextIdx: number } {
  const rows: string[][] = []
  let i = startIdx
  let headerParsed = false
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line || !isTableRow(line)) break
    if (isTableSeparator(line)) {
      i++
      continue
    }
    // divide pelo pipe, removendo células vazias nas bordas
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
    rows.push(cells)
    i++
  }
  if (rows.length === 0) return { html: '', nextIdx: i }

  const header = rows[0]
  const body = rows.slice(1)
  let html = '<table class="hc-table"><thead><tr>'
  for (const cell of header) {
    html += `<th>${applyInline(escapeHtml(cell))}</th>`
  }
  html += '</tr></thead><tbody>'
  for (const row of body) {
    html += '<tr>'
    for (const cell of row) {
      html += `<td>${applyInline(escapeHtml(cell))}</td>`
    }
    html += '</tr>'
  }
  html += '</tbody></table>'
  return { html, nextIdx: i }
}

/** Verifica se uma linha é um fluxo visual (contém → ou -> entre palavras). */
function isFlowLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  // deve conter pelo menos 2 ocorrências de → ou -> para ser um fluxo
  const arrows = (trimmed.match(/→|->/g) || []).length
  return arrows >= 1 && !trimmed.match(/^#{1,4}\s/)
}

/** Renderiza uma linha de fluxo como caixas conectadas por setas. */
function renderFlowLine(line: string): string {
  const parts = line
    .split(/→|->/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  if (parts.length < 2) return `<p>${applyInline(escapeHtml(line))}</p>`
  const boxes = parts
    .map(
      (p) =>
        `<span class="hc-flow-box">${applyInline(escapeHtml(p))}</span><span class="hc-flow-arrow">&rarr;</span>`,
    )
    .join('')
  // remove a última seta
  const cleaned = boxes.replace(/<span class="hc-flow-arrow">&rarr;<\/span>$/, '')
  return `<div class="hc-flow">${cleaned}</div>`
}

/**
 * Detecta o tipo de destaque visual para um heading e retorna a classe CSS.
 * Retorna null se não for um destaque especial.
 */
function detectHighlightClass(title: string): string | null {
  if (matchKeyword(title, KEYWORDS_STATUS)) return 'hc-highlight-status'
  if (matchKeyword(title, KEYWORDS_CONDICOES)) return 'hc-highlight-comercial'
  if (matchKeyword(title, KEYWORDS_ATENCAO)) return 'hc-highlight-atencao'
  if (matchKeyword(title, KEYWORDS_PROXIMOS)) return 'hc-highlight-passos'
  return null
}

/** Converte o texto markdown do campo Handover em HTML seguro para o PDF. */
export function renderHandoverMarkdown(md: string): string {
  if (!md || !md.trim()) {
    return '<p class="hc-empty">Nenhum conteúdo de handover registrado.</p>'
  }

  const normalized = md.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')

  // Pré-cálculo: headings + mapa de renumeração
  const headings = extractHeadings(normalized)
  const renumberMap = buildRenumberMap(headings)

  const blocks: string[] = []
  let i = 0
  let currentHighlight: string | null = null // classe de destaque ativa
  let inHighlightBlock = false

  const closeHighlight = () => {
    if (inHighlightBlock) {
      blocks.push('</div>')
      inHighlightBlock = false
      currentHighlight = null
    }
  }

  const flushParagraph = (buf: string[]) => {
    if (buf.length === 0) return
    const content = buf.join(' ').trim()
    if (content) {
      blocks.push(`<p>${applyInline(escapeHtml(content))}</p>`)
    }
    buf.length = 0
  }

  while (i < lines.length) {
    const rawLine = lines[i]
    const line = rawLine.trimEnd()

    // Linha em branco → fecha parágrafo/bloco atual
    if (line.trim() === '') {
      // não fechamos o highlight em linha em branco para permitir múltiplos
      // parágrafos dentro do destaque
      i++
      continue
    }

    // Linha horizontal: --- ou ***
    if (/^(\s*[-*]){3,}\s*$/.test(line) && !line.match(/^[-*]\s+/)) {
      closeHighlight()
      blocks.push('<hr class="hc-hr" />')
      i++
      continue
    }

    // Quebra de página explícita: [[pagebreak]] ou ---PAGEBREAK---
    if (/^\[\[pagebreak\]\]/i.test(line.trim()) || /^---pagebreak---/i.test(line.trim())) {
      closeHighlight()
      blocks.push('<div class="hc-pagebreak"></div>')
      i++
      continue
    }

    // Tabela markdown
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1]!)) {
      closeHighlight()
      const { html, nextIdx } = parseTable(lines, i)
      if (html) {
        blocks.push(html)
        i = nextIdx
        continue
      }
    }

    // Títulos # ## ### ####
    const h4 = line.match(/^####\s+(.*)$/)
    const h3 = line.match(/^###\s+(.*)$/)
    const h2 = line.match(/^##\s+(.*)$/)
    const h1 = line.match(/^#\s+(.*)$/)

    if (h1 || h2 || h3 || h4) {
      closeHighlight()
      const level = h1 ? 1 : h2 ? 2 : h3 ? 3 : 4
      const text = (h1 || h2 || h3 || h4)![1].trim()
      const newNumber = renumberMap.get(i)
      const displayTitle = newNumber ? rewriteTitleWithNumber(text, newNumber) : text

      // verifica se é um destaque visual
      const highlightClass = detectHighlightClass(text)
      if (highlightClass) {
        currentHighlight = highlightClass
        inHighlightBlock = true
        blocks.push(`<div class="hc-highlight ${highlightClass}">`)
        // o título do destaque é renderizado como h2 com classe própria
        blocks.push(`<h2 class="hc-highlight-title">${applyInline(escapeHtml(displayTitle))}</h2>`)
      } else {
        const tag = level === 1 ? 'h2' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
        const cls = level === 1 ? 'hc-h1' : ''
        blocks.push(
          `<${tag}${cls ? ` class="${cls}"` : ''}>${applyInline(
            escapeHtml(displayTitle),
          )}</${tag}>`,
        )
      }
      i++
      continue
    }

    // Subtítulos numerados sem # (ex: "1.1 Objetivo")
    const subTitle = line.match(/^(\d+(?:\.\d+)+)\s+(.+)$/)
    if (subTitle && !line.match(/^[-*•]/)) {
      closeHighlight()
      const newNumber = renumberMap.get(i) || subTitle[1]
      const text = `${newNumber} ${subTitle[2]}`
      blocks.push(`<h3>${applyInline(escapeHtml(text))}</h3>`)
      i++
      continue
    }

    // Citação/blockquote: > texto
    if (/^>\s?/.test(line.trim())) {
      closeHighlight()
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push(`<blockquote>${applyInline(escapeHtml(quoteLines.join(' ')))}</blockquote>`)
      continue
    }

    // Fluxo visual: linha com → ou -> entre palavras
    if (isFlowLine(line)) {
      closeHighlight()
      blocks.push(renderFlowLine(line.trim()))
      i++
      continue
    }

    // Listas (bullets e numeradas) com suporte a aninhamento
    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line) || /^\s*[a-z]\)\s+/.test(line)) {
      closeHighlight()
      const listHtml = parseList(lines, i)
      blocks.push(listHtml.html)
      i = listHtml.nextIdx
      continue
    }

    // Checklist (se dentro de bloco "próximos passos")
    if (inHighlightBlock && currentHighlight === 'hc-highlight-passos') {
      // renderiza cada item como checkbox ☐
      const item = line.trim().replace(/^[-*]\s*/, '')
      blocks.push(
        `<div class="hc-checklist-item"><span class="hc-checkbox">&#9744;</span> ${applyInline(escapeHtml(item))}</div>`,
      )
      i++
      continue
    }

    // Parágrafo: agrupar linhas consecutivas
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,4}\s+/) &&
      !lines[i].match(/^\s*[-*•]\s+/) &&
      !lines[i].match(/^\s*\d+\.\s+/) &&
      !lines[i].match(/^\s*[a-z]\)\s+/) &&
      !lines[i].match(/^>\s?/) &&
      !/^\[\[pagebreak\]\]/i.test(lines[i].trim()) &&
      !/^---pagebreak---/i.test(lines[i].trim()) &&
      !isFlowLine(lines[i]) &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSeparator(lines[i + 1]!)) &&
      !lines[i].match(/^(\d+(?:\.\d+)+)\s+/)
    ) {
      buf.push(lines[i].trim())
      i++
    }
    flushParagraph(buf)
  }

  closeHighlight()
  return blocks.join('\n')
}

/** Reescreve o título substituindo/mantendo o número inicial. */
function rewriteTitleWithNumber(title: string, newNumber: string): string {
  // se o título já começa com número, substitui
  const numMatch = title.match(/^(\d+(?:\.\d+)*)\.?\s+/)
  if (numMatch) {
    return title.replace(/^(\d+(?:\.\d+)*)\.?\s+/, `${newNumber}. `)
  }
  return `${newNumber}. ${title}`
}

interface ParsedList {
  html: string
  nextIdx: number
}

/** Parseia uma lista (bullet ou numerada) com suporte a aninhamento por indentação. */
function parseList(lines: string[], startIdx: number): ParsedList {
  const items: { level: number; content: string; ordered: boolean }[] = []
  let i = startIdx
  let isOrdered = false
  let isAlpha = false

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      i++
      // permite uma linha em branco dentro de lista se a próxima ainda é lista
      if (
        i < lines.length &&
        (/\s*[-*•]\s+/.test(lines[i]) ||
          /\s*\d+\.\s+/.test(lines[i]) ||
          /\s*[a-z]\)\s+/.test(lines[i]))
      ) {
        continue
      }
      break
    }
    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.*)$/)
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
    const alphaMatch = line.match(/^(\s*)([a-z])\)\s+(.*)$/)
    if (bulletMatch) {
      const level = indentLevel(line)
      items.push({ level, content: bulletMatch[2].trim(), ordered: false })
      i++
    } else if (numMatch) {
      isOrdered = true
      const level = indentLevel(line)
      items.push({ level, content: numMatch[3].trim(), ordered: true })
      i++
    } else if (alphaMatch) {
      isAlpha = true
      isOrdered = true
      const level = indentLevel(line)
      items.push({ level, content: alphaMatch[3].trim(), ordered: true })
      i++
    } else {
      break
    }
  }

  void isAlpha
  const tag = isOrdered ? 'ol' : 'ul'
  const html = buildNestedList(items, 0, tag)
  return { html, nextIdx: i }
}

/** Constrói recursivamente uma lista aninhada a partir dos items. */
function buildNestedList(
  items: { level: number; content: string; ordered: boolean }[],
  startIdx: number,
  tag: string,
): string {
  if (startIdx >= items.length) return ''
  const baseLevel = items[startIdx].level
  let html = `<${tag}>`
  let i = startIdx
  while (i < items.length) {
    const item = items[i]
    if (item.level < baseLevel) break
    if (item.level > baseLevel) {
      // sub-lista: encontra todos os items do nível superior
      const subTag = item.ordered ? 'ol' : 'ul'
      const subHtml = buildNestedList(items, i, subTag === 'ol' ? 'ol' : 'ul')
      // anexa a sub-lista ao <li> anterior
      html = html.replace(/<\/li>$/, subHtml + '</li>')
      // avança i para depois da sub-lista
      // encontra próximo item no nível base ou menor
      let j = i
      while (j < items.length && items[j].level > baseLevel) j++
      i = j
      continue
    }
    html += `<li>${applyInline(escapeHtml(item.content))}</li>`
    i++
  }
  html += `</${tag}>`
  return html
}

// ---------------------------------------------------------------------------
//  Sumário automático
// ---------------------------------------------------------------------------

/** Gera o HTML do sumário a partir dos headings do conteúdo. */
function buildSumario(md: string): { titulo: string; nivel: number; numero: string | null }[] {
  const headings = extractHeadings(md)
  const renumberMap = buildRenumberMap(headings)
  const items: { titulo: string; nivel: number; numero: string | null }[] = []

  for (const { lineIdx, heading } of headings) {
    // limpa o título removendo o número inicial (será reposto pelo renumber)
    let titulo = heading.raw
    const numMatch = titulo.match(/^(\d+(?:\.\d+)*)\.?\s+/)
    if (numMatch) titulo = titulo.replace(/^(\d+(?:\.\d+)*)\.?\s+/, '')
    const newNumber = renumberMap.get(lineIdx) || heading.originalNumber
    items.push({ titulo, nivel: heading.level, numero: newNumber })
  }
  return items
}

// ---------------------------------------------------------------------------
//  PDF / HTML generation
// ---------------------------------------------------------------------------

export interface HandoverPdfData {
  cliente: string
  clienteCnpj?: string | null
  projeto: string
  responsavelComercial: string
  responsavelExecucao: string
  status: string
  conteudo: string
  consultoriaId?: string | null
}

function formatarDataPTBR(date: Date): string {
  const dia = String(date.getDate()).padStart(2, '0')
  const meses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]
  return `${dia} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
}

/** CSS inline do documento Handover — identidade visual Service Logic. */
const HANDOVER_CSS = `
  @page {
    size: A4;
    margin: 22mm 18mm 18mm 18mm;
    @bottom-right {
      content: 'Página ' counter(page) ' de ' counter(pages);
      font-family: 'Times New Roman', 'Liberation Serif', Georgia, serif;
      font-size: 9pt;
      color: #64748b;
    }
    @bottom-left {
      content: 'Service Logic — Documento Interno';
      font-family: 'Times New Roman', 'Liberation Serif', Georgia, serif;
      font-size: 9pt;
      color: #94a3b8;
    }
    @top-center {
      content: 'Service Logic | Handover Comercial';
      font-family: 'Times New Roman', 'Liberation Serif', Georgia, serif;
      font-size: 8pt;
      color: #cbd5e1;
    }
  }

  @page capa {
    margin: 0;
    @bottom-right { content: none; }
    @bottom-left { content: none; }
    @top-center { content: none; }
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }

  body {
    font-family: 'Times New Roman', 'Liberation Serif', 'Nimbus Roman', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.5;
    color: #1e293b;
  }

  /* ===================== CAPA EXECUTIVA ===================== */
  .hc-cover {
    page: capa;
    page-break-after: always;
    break-after: page;
    min-height: 297mm;
    padding: 28mm 22mm 22mm 22mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background: #fff;
  }
  .hc-cover .hc-cover-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 18mm;
  }
  .hc-cover .hc-cover-logo img {
    height: 60px;
    width: auto;
    object-fit: contain;
  }
  .hc-cover .hc-cover-title-block {
    text-align: center;
    margin-bottom: 14mm;
  }
  .hc-cover h1.hc-cover-title {
    font-size: 26pt;
    font-weight: 700;
    color: #1b4382;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin: 0 0 6pt 0;
    line-height: 1.15;
  }
  .hc-cover .hc-cover-title-accent {
    color: #f37021;
  }
  .hc-cover .hc-cover-subtitle {
    font-size: 14pt;
    color: #475569;
    margin-top: 4pt;
    font-style: italic;
  }
  .hc-cover .hc-cover-divider {
    width: 60%;
    margin: 8mm auto;
    border: 0;
    border-top: 2pt solid #f37021;
  }
  .hc-cover .hc-cover-info-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 auto;
    font-size: 11pt;
    break-inside: avoid;
  }
  .hc-cover .hc-cover-info-table td {
    border: 0.5pt solid #cbd5e1;
    padding: 7pt 10pt;
    vertical-align: top;
  }
  .hc-cover .hc-cover-info-table .hc-label {
    font-weight: 700;
    color: #1b4382;
    text-transform: uppercase;
    font-size: 9pt;
    letter-spacing: 0.4px;
    background: #f8fafc;
    width: 42mm;
    white-space: nowrap;
  }
  .hc-cover .hc-cover-info-table .hc-value {
    color: #1e293b;
    font-size: 11pt;
  }
  .hc-cover .hc-cover-footer {
    margin-top: auto;
    padding-top: 8mm;
    border-top: 0.5pt solid #e2e8f0;
    text-align: center;
    font-size: 8.5pt;
    color: #94a3b8;
  }

  /* ===================== SUMÁRIO ===================== */
  .hc-sumario {
    page-break-after: always;
    break-after: page;
    padding: 4mm 0;
  }
  .hc-sumario h2.hc-sumario-title {
    font-size: 16pt;
    font-weight: 700;
    color: #1b4382;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 12pt 0;
    padding-bottom: 4pt;
    border-bottom: 2pt solid #f37021;
  }
  .hc-sumario .hc-sumario-item {
    display: flex;
    align-items: baseline;
    margin: 5pt 0;
    font-size: 11pt;
    break-inside: avoid;
  }
  .hc-sumario .hc-sumario-num {
    font-weight: 700;
    color: #f37021;
    margin-right: 6pt;
    min-width: 24pt;
  }
  .hc-sumario .hc-sumario-text {
    color: #1e293b;
  }
  .hc-sumario .hc-sumario-dots {
    flex: 1;
    border-bottom: 1px dotted #94a3b8;
    margin: 0 6pt;
    transform: translateY(-3px);
  }
  .hc-sumario .hc-sumario-page {
    color: #64748b;
    font-size: 10pt;
  }
  .hc-sumario .hc-sub-level-2 { padding-left: 8mm; font-size: 10.5pt; }
  .hc-sumario .hc-sub-level-3 { padding-left: 16mm; font-size: 10pt; }

  /* ===================== CABEÇALHO INTERNO ===================== */
  .hc-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 5px;
    margin-bottom: 10pt;
    border-bottom: 0.5pt solid #cbd5e1;
    font-size: 8.5pt;
    color: #94a3b8;
  }
  .hc-page-header img {
    height: 22px;
    width: auto;
    object-fit: contain;
  }
  .hc-page-header .hc-page-header-text {
    flex: 1;
    text-align: center;
    letter-spacing: 0.3px;
  }

  /* ===================== CONTEÚDO ===================== */
  .hc-body h2 {
    font-size: 13pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #1b4382;
    letter-spacing: 0.4px;
    margin: 16pt 0 6pt 0;
    padding-bottom: 3pt;
    border-bottom: 1.5pt solid #f37021;
    break-after: avoid;
    page-break-after: avoid;
  }
  .hc-body h2.hc-h1 {
    font-size: 15pt;
    border-bottom: 2pt solid #f37021;
    padding-bottom: 4pt;
    margin-top: 18pt;
  }
  .hc-body h3 {
    font-size: 11.5pt;
    font-weight: 700;
    color: #1b4382;
    margin: 12pt 0 4pt 0;
    break-after: avoid;
    page-break-after: avoid;
  }
  .hc-body h4 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #334155;
    margin: 10pt 0 3pt 0;
    break-after: avoid;
    page-break-after: avoid;
  }
  .hc-body p {
    margin: 0 0 6pt 0;
    text-align: justify;
    orphans: 3;
    widows: 3;
  }
  .hc-body p.hc-empty {
    color: #64748b;
    font-style: italic;
    text-align: center;
    padding: 20pt 0;
  }
  .hc-body ul,
  .hc-body ol {
    margin: 4pt 0 6pt 6mm;
    padding-left: 5mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .hc-body ul { list-style-type: disc; }
  .hc-body ol { list-style-type: decimal; }
  .hc-body li {
    margin-bottom: 2pt;
    text-align: justify;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .hc-body strong { font-weight: 700; }
  .hc-body em { font-style: italic; }
  .hc-body blockquote {
    margin: 6pt 0;
    padding: 5pt 8pt;
    border-left: 3pt solid #1b4382;
    background: #f1f5f9;
    font-style: italic;
    color: #334155;
    break-inside: avoid;
  }
  .hc-body hr.hc-hr {
    border: 0;
    border-top: 1pt solid #cbd5e1;
    margin: 10pt 0;
  }

  /* Tabelas */
  .hc-body .hc-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6pt 0;
    font-size: 10pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .hc-body .hc-table th,
  .hc-body .hc-table td {
    border: 0.5pt solid #cbd5e1;
    padding: 4pt 6pt;
    text-align: left;
    vertical-align: top;
  }
  .hc-body .hc-table th {
    background: #f8fafc;
    color: #1b4382;
    font-weight: 700;
  }

  /* Fluxo visual */
  .hc-body .hc-flow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4pt;
    margin: 8pt 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .hc-body .hc-flow-box {
    background: #dbeafe;
    color: #1b4382;
    border: 0.5pt solid #93c5fd;
    border-radius: 5pt;
    padding: 4pt 9pt;
    font-size: 10pt;
    font-weight: 600;
    text-align: center;
    break-inside: avoid;
  }
  .hc-body .hc-flow-arrow {
    color: #f37021;
    font-size: 12pt;
    font-weight: 700;
  }

  /* Quebra de página explícita */
  .hc-body .hc-pagebreak {
    page-break-after: always;
    break-after: page;
    height: 0;
  }

  /* ===================== DESTAQUES VISUAIS ===================== */
  .hc-highlight {
    margin: 10pt 0;
    padding: 8pt 10pt;
    border-radius: 4pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .hc-highlight .hc-highlight-title {
    font-size: 11.5pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #1b4382;
    margin: 0 0 6pt 0;
    padding-bottom: 3pt;
    border-bottom: 1pt solid rgba(27,67,130,0.25);
    break-after: avoid;
    page-break-after: avoid;
  }
  /* Condições comerciais / valores */
  .hc-highlight-comercial {
    background: #f8fafc;
    border-left: 4pt solid #f37021;
  }
  .hc-highlight-comercial strong { color: #c2410c; }
  /* Pontos de atenção / riscos */
  .hc-highlight-atencao {
    background: #fefce8;
    border-left: 4pt solid #f59e0b;
  }
  .hc-highlight-atencao .hc-highlight-title::before {
    content: '⚠ ';
    color: #b45309;
  }
  /* Próximos passos (checklist) */
  .hc-highlight-passos {
    background: #f0f9ff;
    border-left: 4pt solid #1b4382;
  }
  .hc-checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 6pt;
    margin: 3pt 0;
    break-inside: avoid;
  }
  .hc-checklist-item .hc-checkbox {
    font-size: 12pt;
    color: #1b4382;
    line-height: 1.2;
  }
  /* Status da passagem comercial (quadro-resumo) */
  .hc-highlight-status {
    background: #f8fafc;
    border: 1pt solid #cbd5e1;
    border-left: 4pt solid #1b4382;
  }
  .hc-status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4pt 10pt;
    margin-top: 4pt;
  }
  .hc-status-grid .hc-status-cell {
    display: flex;
    justify-content: space-between;
    padding: 4pt 6pt;
    border-bottom: 0.5pt solid #e2e8f0;
    font-size: 10pt;
    break-inside: avoid;
  }
  .hc-status-grid .hc-status-label {
    font-weight: 600;
    color: #334155;
  }
  .hc-status-grid .hc-status-value {
    color: #1b4382;
    font-weight: 700;
  }

  /* ===================== PREVIEW (não impresso) ===================== */
  .hc-preview-toolbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #1e293b;
    color: #fff;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: Arial, Helvetica, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .hc-preview-toolbar .hc-preview-title {
    font-size: 14px;
    font-weight: 600;
    flex: 1;
  }
  .hc-preview-toolbar button {
    background: #f37021;
    color: #fff;
    border: none;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .hc-preview-toolbar button:hover { background: #d35f15; }
  .hc-preview-toolbar button.hc-btn-secondary {
    background: transparent;
    border: 1px solid #64748b;
  }
  .hc-preview-toolbar button.hc-btn-secondary:hover {
    background: #334155;
  }

  @media screen {
    body { background: #e5e7eb; padding: 0; }
    .hc-preview-toolbar { display: flex !important; }
    .hc-document-wrap {
      max-width: 210mm;
      margin: 20px auto;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      padding: 22mm 18mm 18mm 18mm;
      min-height: 297mm;
      box-sizing: border-box;
    }
    .hc-cover {
      min-height: auto;
      padding: 0 0 30mm 0;
    }
  }

  @media print {
    body {
      padding: 0 !important;
      margin: 0 !important;
      font-size: 11pt;
      line-height: 1.45;
      color: #000 !important;
      background: #fff !important;
    }
    .hc-preview-toolbar { display: none !important; }
    .hc-document-wrap {
      max-width: none !important;
      margin: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .hc-cover {
      min-height: 257mm;
      padding: 28mm 22mm 22mm 22mm !important;
    }
    .hc-page-header { display: flex !important; }
    .hc-page-header img {
      height: 22px !important;
      max-height: 22px !important;
      display: block !important;
    }
    .hc-flow { display: flex !important; }
    .hc-flow-box {
      background: #dbeafe !important;
      color: #1b4382 !important;
    }
    .hc-highlight { break-inside: avoid; }
    .hc-no-print { display: none !important; }
  }
`

/**
 * Abre o documento Handover em uma nova aba — pode ser preview (sem impressão
 * automática) ou PDF (com botão de impressão no topo).
 *
 * @param preview true = modo visualização (toolbar no topo, sem auto-impressão)
 */
export function openHandoverPdf(data: HandoverPdfData, opts?: { preview?: boolean }): void {
  const now = new Date()
  const corpoHtml = renderHandoverMarkdown(data.conteudo)
  const sumarioItems = buildSumario(data.conteudo)
  const absoluteLogoUrl = new URL(logoUrl, window.location.origin).href
  const statusHumanizado = humanizarStatus(data.status)

  // ---- Linhas da tabela da capa ----
  const coverRows = [
    {
      label: 'Cliente',
      value: data.clienteCnpj ? `${data.cliente} — CNPJ ${data.clienteCnpj}` : data.cliente || '—',
    },
    { label: 'Projeto', value: data.projeto || '—' },
    { label: 'Responsável Comercial', value: data.responsavelComercial || '—' },
    { label: 'Responsável pela Execução', value: data.responsavelExecucao || '—' },
    { label: 'Data', value: formatarDataPTBR(now) },
    { label: 'Status', value: statusHumanizado },
  ]
    .map(
      (r) =>
        `<tr><td class="hc-label">${escapeHtml(r.label)}</td><td class="hc-value">${escapeHtml(r.value)}</td></tr>`,
    )
    .join('\n')

  // ---- Sumário ----
  const sumarioHtml = sumarioItems.length
    ? sumarioItems
        .map((item, idx) => {
          const levelClass =
            item.nivel === 2 ? 'hc-sub-level-2' : item.nivel === 3 ? 'hc-sub-level-3' : ''
          const num = item.numero
            ? `<span class="hc-sumario-num">${escapeHtml(item.numero)}</span>`
            : ''
          const pageEst = Math.max(3, Math.ceil((idx + 1) * 0.6) + 2)
          return `<div class="hc-sumario-item ${levelClass}">
            ${num}
            <span class="hc-sumario-text">${applyInline(escapeHtml(item.titulo))}</span>
            <span class="hc-sumario-dots"></span>
            <span class="hc-sumario-page">${pageEst}</span>
          </div>`
        })
        .join('\n')
    : '<p class="hc-empty">Nenhum conteúdo para sumário.</p>'

  // ---- Cabeçalho interno (aparece em todas as páginas internas) ----
  const pageHeader = `<div class="hc-page-header">
    <img src="${absoluteLogoUrl}" alt="Service Logic" />
    <span class="hc-page-header-text">Service Logic | Handover Comercial | ${escapeHtml(data.cliente || 'Consultoria')}</span>
    <span style="min-width:60px;"></span>
  </div>`

  // ---- Toolbar de preview (não impressa) ----
  const previewToolbar = opts?.preview
    ? `<div class="hc-preview-toolbar hc-no-print">
        <span class="hc-preview-title">📄 Handover Comercial — ${escapeHtml(data.cliente || 'Consultoria')}</span>
        <button onclick="window.print()">🖨️ Imprimir / Gerar PDF</button>
        <button class="hc-btn-secondary" onclick="window.print()">⬇️ Baixar PDF</button>
      </div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Handover Comercial — ${escapeHtml(data.cliente || 'Consultoria')}</title>
  <style>${HANDOVER_CSS}</style>
</head>
<body>
  ${previewToolbar}
  <div class="hc-document-wrap">
    <!-- CAPA EXECUTIVA -->
    <div class="hc-cover">
      <div class="hc-cover-logo">
        <img src="${absoluteLogoUrl}" alt="Service Logic" />
      </div>
      <div class="hc-cover-title-block">
        <h1 class="hc-cover-title">HANDOVER COMERCIAL <span class="hc-cover-title-accent">&rarr;</span> EXECUÇÃO</h1>
        <div class="hc-cover-subtitle">${escapeHtml(data.projeto || data.cliente || 'Consultoria')}</div>
      </div>
      <hr class="hc-cover-divider" />
      <table class="hc-cover-info-table">
        ${coverRows}
      </table>
      <div class="hc-cover-footer">
        Documento gerado por Service Logic — ${escapeHtml(formatarDataPTBR(now))}
      </div>
    </div>

    <!-- SUMÁRIO AUTOMÁTICO -->
    <div class="hc-sumario">
      <h2 class="hc-sumario-title">Sumário</h2>
      ${sumarioHtml}
    </div>

    <!-- CONTEÚDO -->
    ${pageHeader}
    <div class="hc-body">
      ${corpoHtml}
    </div>
  </div>
</body>
</html>`

  // Gera Blob com HTML autossuficiente e abre em nova aba.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error(
      'Não foi possível abrir o documento. Verifique se o navegador permite abrir novas abas.',
    )
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
