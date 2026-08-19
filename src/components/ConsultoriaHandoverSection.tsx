import { useEffect, useRef, useState, useCallback } from 'react'
import type { ClipboardEvent } from 'react'
import {
  Save,
  Loader2,
  FileDown,
  Eye,
  History,
  Clock,
  Bold,
  Italic,
  List,
  ListOrdered,
  Table as TableIcon,
  Highlighter,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { openHandoverPdf } from '@/lib/handover-pdf'
import {
  createHandoverVersao,
  listHandoverVersoes,
  type HandoverVersao,
} from '@/services/handover-versoes'

/** Campos de handover persistidos no registro (consultoria ou implementação). */
export interface HandoverPatch {
  handover_comercial: string
  handover_atualizado_em: string
  handover_atualizado_por: string
}

interface Props {
  /** ID do registro (consultoria ou implementação) onde o handover é salvo. */
  projectId: string
  /** Contexto: detalhe de implementação vs. CRM consultoria. */
  contexto?: 'implementacao' | 'consultoria'
  /** Conteúdo atual do handover comercial (markdown ou HTML). */
  handoverComercial?: string | null
  /** ISO timestamp da última atualização do handover. */
  handoverAtualizadoEm?: string | null
  /** E-mail/nome de quem atualizou o handover por último. */
  handoverAtualizadoPor?: string | null
  /** Nome do cliente, usado no PDF gerado. */
  clienteNome?: string | null
  /** CNPJ do cliente, exibido na capa do PDF. */
  clienteCnpj?: string | null
  /** Nome do projeto/consultoria (se omitido, usa "Service Logic | cliente"). */
  projetoNome?: string | null
  /** Status do projeto, exibido no PDF gerado (humanizado). */
  status?: string | null
  /** E-mail do usuário logado, usado como autor da última atualização. */
  currentUserEmail?: string | null
  /**
   * Persiste o handover no backend. Cada contexto (CRM consultoria vs.
   * detalhe de implementação) injeta o serviço correto. Deve rejeitar em
   * caso de erro para o componente exibir o toast de falha.
   */
  onSave: (input: HandoverPatch) => Promise<void>
  /** Chamado após salvar com sucesso para o pai atualizar o estado local. */
  onSaved?: (patch: HandoverPatch) => void
}

/* ===========================================================================
 *  Conversores markdown ↔ HTML (sub集 para o editor WYSIWYG)
 *  O conteúdo é sempre salvo como MARKDOWN no banco (compatibilidade com o
 *  parser robusto do PDF e com dados legados). O editor converte para HTML
 *  na exibição e de volta para markdown no salvamento.
 * ======================================================================== */

/** Escapa texto para HTML. */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Aplica negrito/itálico inline sobre texto JÁ escapado. */
function inlineMd(s: string): string {
  let out = s
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>')
  return out
}

function inlineHtmlToMd(html: string): string {
  let out = html
  out = out.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
  out = out.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
  out = out.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
  out = out.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
  return out
}

function isTableSep(line: string): boolean {
  return /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(line) && line.includes('-')
}
function isTableRow(line: string): boolean {
  return line.trim().includes('|') && line.trim().length > 0
}

/** Converte markdown → HTML limpo (sem classes do PDF) para o contentEditable. */
function markdownToEditorHtml(md: string): string {
  if (!md || !md.trim()) return ''
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let i = 0

  const flushPara = (buf: string[]) => {
    if (!buf.length) return
    const c = buf.join(' ').trim()
    if (c) blocks.push(`<p>${inlineMd(esc(c))}</p>`)
    buf.length = 0
  }

  while (i < lines.length) {
    const line = lines[i].trimEnd()

    if (line.trim() === '') {
      i++
      continue
    }

    // pagebreak
    if (/^\[\[pagebreak\]\]/i.test(line.trim()) || /^---pagebreak---/i.test(line.trim())) {
      blocks.push('<hr class="pagebreak" data-pagebreak="1" />')
      i++
      continue
    }
    // hr
    if (/^(\s*[-*]){3,}\s*$/.test(line) && !line.match(/^[-*]\s+/)) {
      blocks.push('<hr />')
      i++
      continue
    }

    // headings
    const h4 = line.match(/^####\s+(.*)$/)
    const h3 = line.match(/^###\s+(.*)$/)
    const h2 = line.match(/^##\s+(.*)$/)
    const h1 = line.match(/^#\s+(.*)$/)
    if (h1) {
      blocks.push(`<h1>${inlineMd(esc(h1[1].trim()))}</h1>`)
      i++
      continue
    }
    if (h2) {
      blocks.push(`<h2>${inlineMd(esc(h2[1].trim()))}</h2>`)
      i++
      continue
    }
    if (h3) {
      blocks.push(`<h3>${inlineMd(esc(h3[1].trim()))}</h3>`)
      i++
      continue
    }
    if (h4) {
      blocks.push(`<h4>${inlineMd(esc(h4[1].trim()))}</h4>`)
      i++
      continue
    }

    // subtítulo numerado
    const sub = line.match(/^(\d+(?:\.\d+)+)\s+(.+)$/)
    if (sub && !line.match(/^[-*•]/)) {
      blocks.push(`<h3>${inlineMd(esc(line.trim()))}</h3>`)
      i++
      continue
    }

    // blockquote
    if (/^>\s?/.test(line.trim())) {
      const qs: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        qs.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push(`<blockquote>${inlineMd(esc(qs.join(' ')))}</blockquote>`)
      continue
    }

    // tabela
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1]!)) {
      const rows: string[][] = []
      while (i < lines.length && isTableRow(lines[i])) {
        if (isTableSep(lines[i])) {
          i++
          continue
        }
        const cells = lines[i]
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim())
        rows.push(cells)
        i++
      }
      if (rows.length) {
        const header = rows[0]
        const body = rows.slice(1)
        let h = '<table><thead><tr>'
        for (const c of header) h += `<th>${inlineMd(esc(c))}</th>`
        h += '</tr></thead><tbody>'
        for (const r of body) {
          h += '<tr>'
          for (const c of r) h += `<td>${inlineMd(esc(c))}</td>`
          h += '</tr>'
        }
        h += '</tbody></table>'
        blocks.push(h)
      }
      continue
    }

    // listas (uma passada simples com aninhamento por indentação)
    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line) || /^\s*[a-z]\)\s+/.test(line)) {
      const items: { level: number; text: string; ordered: boolean }[] = []
      let ordered = false
      while (i < lines.length) {
        const l = lines[i]
        if (l.trim() === '') {
          i++
          if (i < lines.length && /^\s*([-*•]|\d+\.|[a-z]\))\s/.test(lines[i])) continue
          break
        }
        const bm = l.match(/^(\s*)[-*•]\s+(.*)$/)
        const nm = l.match(/^(\s*)(\d+)\.\s+(.*)$/)
        const am = l.match(/^(\s*)([a-z])\)\s+(.*)$/)
        if (bm) {
          items.push({
            level: Math.floor(bm[1].replace(/\t/g, '  ').length / 2),
            text: bm[2].trim(),
            ordered: false,
          })
          i++
        } else if (nm) {
          ordered = true
          items.push({
            level: Math.floor(nm[1].replace(/\t/g, '  ').length / 2),
            text: nm[3].trim(),
            ordered: true,
          })
          i++
        } else if (am) {
          ordered = true
          items.push({
            level: Math.floor(am[1].replace(/\t/g, '  ').length / 2),
            text: am[3].trim(),
            ordered: true,
          })
          i++
        } else break
      }
      const tag = ordered ? 'ol' : 'ul'
      blocks.push(buildListHtml(items, tag))
      continue
    }

    // parágrafo
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,4}\s+/) &&
      !lines[i].match(/^\s*[-*•]\s+/) &&
      !lines[i].match(/^\s*\d+\.\s+/) &&
      !lines[i].match(/^\s*[a-z]\)\s+/) &&
      !/^>\s?/.test(lines[i].trim()) &&
      !/^\[\[pagebreak\]\]/i.test(lines[i].trim()) &&
      !/^---pagebreak---/i.test(lines[i].trim()) &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]!)) &&
      !lines[i].match(/^(\d+(?:\.\d+)+)\s+/)
    ) {
      buf.push(lines[i].trim())
      i++
    }
    flushPara(buf)
  }

  return blocks.join('\n')
}

function buildListHtml(
  items: { level: number; text: string; ordered: boolean }[],
  tag: string,
): string {
  if (!items.length) return ''
  const base = items[0].level
  let html = `<${tag}>`
  let i = 0
  while (i < items.length) {
    const it = items[i]
    if (it.level > base) {
      // coleta sub-items
      const sub: { level: number; text: string; ordered: boolean }[] = []
      while (i < items.length && items[i].level > base) {
        sub.push(items[i])
        i++
      }
      const subTag = sub[0].ordered ? 'ol' : 'ul'
      const subHtml = buildListHtml(sub, subTag)
      html = html.replace(/<\/li>$/, subHtml + '</li>')
    } else if (it.level < base) {
      break
    } else {
      html += `<li>${inlineMd(esc(it.text))}</li>`
      i++
    }
  }
  html += `</${tag}>`
  return html
}

/** Converte o HTML do contentEditable de volta para markdown. */
function editorHtmlToMarkdown(html: string): string {
  const container = document.createElement('div')
  container.innerHTML = html
  return nodeToMarkdown(container).trim()
}

function nodeToMarkdown(node: Node): string {
  let out = ''
  node.childNodes.forEach((child) => {
    out += nodeToMdNode(child)
  })
  return out
}

function nodeToMdNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const txt = node.textContent || ''
    // coloca texto como está
    return txt
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const inner = nodeToMarkdown(el)
  switch (tag) {
    case 'h1':
      return `\n# ${inner.trim()}\n\n`
    case 'h2':
      return `\n## ${inner.trim()}\n\n`
    case 'h3':
      return `\n### ${inner.trim()}\n\n`
    case 'h4':
      return `\n#### ${inner.trim()}\n\n`
    case 'p': {
      const t = inner.trim()
      return t ? `${t}\n\n` : ''
    }
    case 'br':
      return '\n'
    case 'strong':
    case 'b':
      return `**${inner}**`
    case 'em':
    case 'i':
      return `*${inner}*`
    case 'blockquote': {
      const t = inner.trim()
      return t ? `> ${t}\n\n` : ''
    }
    case 'hr': {
      if (el.getAttribute('data-pagebreak') === '1' || el.classList.contains('pagebreak')) {
        return '\n[[pagebreak]]\n\n'
      }
      return '\n---\n\n'
    }
    case 'ul':
    case 'ol': {
      return listElToMd(el, tag === 'ol')
    }
    case 'table':
      return tableToMd(el)
    case 'div':
    case 'span':
      return inner
    default:
      return inner
  }
}

function listElToMd(el: HTMLElement, ordered: boolean): string {
  return collectListMd(el, ordered, 0) + '\n'
}

function collectListMd(el: HTMLElement, ordered: boolean, depth: number): string {
  let out = ''
  let counter = 1
  const indent = '  '.repeat(depth)
  // Percorre APENAS os <li> filhos diretos para preservar a hierarquia.
  let child = el.firstElementChild as HTMLElement | null
  while (child) {
    if (child.tagName.toLowerCase() === 'li') {
      // clona e remove sub-listas DENTRO deste <li> antes de extrair o texto
      const clone = child.cloneNode(true) as HTMLElement
      clone.querySelectorAll(':scope > ul, :scope > ol').forEach((s) => s.remove())
      const text = nodeToMarkdown(clone).trim()
      const prefix = ordered ? `${counter}. ` : '- '
      out += `${indent}${prefix}${text}\n`
      counter++
      // agora processa as sub-listas reais dentro do <li> original
      let sub = child.firstElementChild as HTMLElement | null
      while (sub) {
        const tagSub = sub.tagName.toLowerCase()
        if (tagSub === 'ul' || tagSub === 'ol') {
          out += collectListMd(sub, tagSub === 'ol', depth + 1)
        }
        sub = sub.nextElementSibling as HTMLElement | null
      }
    }
    child = child.nextElementSibling as HTMLElement | null
  }
  return out
}

function tableToMd(el: HTMLElement): string {
  const rows: string[][] = []
  el.querySelectorAll('tr').forEach((tr) => {
    const cells: string[] = []
    tr.querySelectorAll('th, td').forEach((c) => {
      cells.push(nodeToMarkdown(c).trim())
    })
    rows.push(cells)
  })
  if (!rows.length) return ''
  const cols = rows[0].length
  const lines: string[] = []
  lines.push('| ' + rows[0].join(' | ') + ' |')
  lines.push('| ' + rows[0].map(() => '---').join(' | ') + ' |')
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    while (row.length < cols) row.push('')
    lines.push('| ' + row.join(' | ') + ' |')
  }
  return '\n' + lines.join('\n') + '\n\n'
}

/* ===========================================================================
 *  Componente
 * ======================================================================== */

export function ConsultoriaHandoverSection({
  projectId,
  contexto = 'implementacao',
  handoverComercial,
  handoverAtualizadoEm,
  handoverAtualizadoPor,
  clienteNome,
  clienteCnpj,
  projetoNome,
  status,
  currentUserEmail,
  onSave,
  onSaved,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastLoadedRef = useRef<string>('') // último markdown carregado
  const [respComercial, setRespComercial] = useState('')
  const [respExecucao, setRespExecucao] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [versoes, setVersoes] = useState<HandoverVersao[]>([])
  const [loadingVersoes, setLoadingVersoes] = useState(false)

  // Carrega o conteúdo no editor quando o prop muda (e difere do último carregado).
  useEffect(() => {
    const md = handoverComercial || ''
    if (md !== lastLoadedRef.current) {
      lastLoadedRef.current = md
      if (editorRef.current) {
        const isHtml = /^\s*</.test(md) && /<\/(p|h[1-6]|ul|ol|table|div|blockquote)>/i.test(md)
        editorRef.current.innerHTML = isHtml ? md : markdownToEditorHtml(md)
      }
    }
  }, [handoverComercial])

  // Carrega versões + pré-preenche responsáveis a partir da versão mais recente.
  const loadVersoes = useCallback(async () => {
    setLoadingVersoes(true)
    try {
      const list = await listHandoverVersoes(contexto, projectId, 5)
      setVersoes(list)
      if (list.length > 0) {
        const latest = list[0]
        if (latest.responsavel_comercial && !respComercial)
          setRespComercial(latest.responsavel_comercial)
        if (latest.responsavel_execucao && !respExecucao)
          setRespExecucao(latest.responsavel_execucao)
      }
    } catch {
      // silencioso — versões são complementares
    } finally {
      setLoadingVersoes(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto, projectId])

  useEffect(() => {
    loadVersoes()
  }, [loadVersoes])

  // ---- Operações da toolbar (execCommand) ----
  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus()
    try {
      document.execCommand(cmd, false, val)
    } catch {
      /* noop */
    }
  }, [])

  const insertHtml = useCallback((html: string) => {
    editorRef.current?.focus()
    try {
      document.execCommand('insertHTML', false, html)
    } catch {
      /* noop */
    }
  }, [])

  const handleHeading = useCallback(
    (tag: string) => {
      exec('formatBlock', tag)
    },
    [exec],
  )

  const handleTable = useCallback(() => {
    insertHtml(
      '<table><thead><tr><th>Coluna 1</th><th>Coluna 2</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br/></p>',
    )
  }, [insertHtml])

  const handleHighlight = useCallback(() => {
    editorRef.current?.focus()
    try {
      // Chrome usa backColor, Firefox usa hiliteColor
      if (!document.execCommand('hiliteColor', false, '#fef08a')) {
        document.execCommand('backColor', false, '#fef08a')
      }
    } catch {
      try {
        document.execCommand('backColor', false, '#fef08a')
      } catch {
        /* noop */
      }
    }
  }, [])

  const handlePageBreak = useCallback(() => {
    insertHtml('<hr class="pagebreak" data-pagebreak="1" /><p><br/></p>')
  }, [insertHtml])

  // ---- Leitura do markdown atual do editor ----
  const getEditorMarkdown = useCallback((): string => {
    if (!editorRef.current) return ''
    const html = editorRef.current.innerHTML
    return editorHtmlToMarkdown(html)
  }, [])

  // ---- Salvamento ----
  const handleSave = async () => {
    const md = getEditorMarkdown()
    setSaving(true)
    try {
      const agora = new Date().toISOString()
      const por = currentUserEmail || 'Usuário'
      const patch: HandoverPatch = {
        handover_comercial: md,
        handover_atualizado_em: agora,
        handover_atualizado_por: por,
      }
      await onSave(patch)
      lastLoadedRef.current = md
      onSaved?.(patch)
      // Cria nova versão na tabela handover_versoes
      try {
        await createHandoverVersao({
          contexto,
          registroId: projectId,
          conteudo: md,
          responsavelComercial: respComercial,
          responsavelExecucao: respExecucao,
          criadoPor: por,
        })
        await loadVersoes()
      } catch (e) {
        // versão é complementar; não bloqueia o salvamento principal
        console.warn('Falha ao registrar versão do handover', e)
      }
      toast.success('Handover comercial salvo com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao salvar handover: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  // ---- Geração de PDF / Preview ----
  const buildPdfData = (conteudo: string) => ({
    cliente: clienteNome || 'N/A',
    clienteCnpj: clienteCnpj || null,
    projeto: projetoNome || `Service Logic | ${clienteNome || 'N/A'}`,
    responsavelComercial: respComercial,
    responsavelExecucao: respExecucao,
    status: status || '—',
    conteudo,
    consultoriaId: contexto === 'consultoria' ? projectId : null,
  })

  const handleGeneratePdf = async () => {
    setGenerating(true)
    try {
      openHandoverPdf(buildPdfData(getEditorMarkdown()))
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar PDF')
    } finally {
      setGenerating(false)
    }
  }

  const handlePreview = async () => {
    setGenerating(true)
    try {
      openHandoverPdf(buildPdfData(getEditorMarkdown()), { preview: true })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao abrir preview')
    } finally {
      setGenerating(false)
    }
  }

  const handlePreviewVersao = (v: HandoverVersao) => {
    try {
      openHandoverPdf(buildPdfData(v.conteudo || ''), { preview: true })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao abrir versão')
    }
  }

  // ---- Paste: preserva formatação básica de Word/Docs ----
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    // Permite o comportamento padrão, que já preserva negrito/listas/parágrafos.
    // Removemos atributos style/class para manter o HTML limpo após a inserção.
    setTimeout(() => {
      if (!editorRef.current) return
      editorRef.current.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'))
      editorRef.current.querySelectorAll('[class]').forEach((el) => {
        if (!el.classList.contains('pagebreak')) el.removeAttribute('class')
      })
      // remove fontes aninhados do Word
      editorRef.current.querySelectorAll('font, o:p, span[lang]').forEach((el) => {
        const parent = el.parentNode
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el)
          parent.removeChild(el)
        }
      })
    }, 0)
  }

  const formatarDataHora = (iso: string | null) => {
    if (!iso) return null
    try {
      const d = new Date(iso)
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const toolbarBtn = (icon: LucideIcon, title: string, onClick: () => void, label?: string) => {
    const Icon = icon
    return (
      <button
        type="button"
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
      >
        <Icon className="h-3.5 w-3.5" />
        {label && <span className="hidden sm:inline">{label}</span>}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Handover Comercial &rarr; Execução
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Editor rico: use a toolbar para formatar. Atalhos{' '}
            <kbd className="text-[10px] bg-slate-100 px-1 rounded">Ctrl+B</kbd> (negrito) e{' '}
            <kbd className="text-[10px] bg-slate-100 px-1 rounded">Ctrl+I</kbd> (itálico). Colar do
            Word/Google Docs preserva a formatação básica.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePreview}
            disabled={generating}
            className="border-slate-400 text-slate-700 hover:bg-slate-100"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5 mr-1" />
            )}
            Visualizar Handover
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={generating}
            className="border-[#1b4382] text-[#1b4382] hover:bg-[#1b4382] hover:text-white"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5 mr-1" />
            )}
            Gerar PDF
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Responsável Comercial</Label>
          <Input
            placeholder="Nome de quem fechou o projeto"
            value={respComercial}
            onChange={(e) => setRespComercial(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Responsável pela Execução</Label>
          <Input
            placeholder="Nome de quem vai executar a consultoria"
            value={respExecucao}
            onChange={(e) => setRespExecucao(e.target.value)}
          />
        </div>
      </div>

      {/* Toolbar do editor rico */}
      <div className="flex items-center gap-1 flex-wrap p-2 rounded-md border border-slate-200 bg-slate-50">
        {toolbarBtn(Heading1, 'Título nível 1', () => handleHeading('H1'))}
        {toolbarBtn(Heading2, 'Título nível 2', () => handleHeading('H2'))}
        {toolbarBtn(Heading3, 'Título nível 3', () => handleHeading('H3'))}
        <span className="w-px h-5 bg-slate-300 mx-1" />
        {toolbarBtn(Bold, 'Negrito (Ctrl+B)', () => exec('bold'))}
        {toolbarBtn(Italic, 'Itálico (Ctrl+I)', () => exec('italic'))}
        <span className="w-px h-5 bg-slate-300 mx-1" />
        {toolbarBtn(List, 'Lista com bullets', () => exec('insertUnorderedList'))}
        {toolbarBtn(ListOrdered, 'Lista numerada', () => exec('insertOrderedList'))}
        {toolbarBtn(TableIcon, 'Inserir tabela 2x2', handleTable)}
        {toolbarBtn(Highlighter, 'Destaque (cor de fundo)', handleHighlight)}
        <span className="w-px h-5 bg-slate-300 mx-1" />
        {toolbarBtn(Undo, 'Desfazer', () => exec('undo'))}
        {toolbarBtn(Redo, 'Refazer', () => exec('redo'))}
        <span className="w-px h-5 bg-slate-300 mx-1" />
        {toolbarBtn(Plus, 'Quebra de página', handlePageBreak, 'Quebra página')}
      </div>

      {/* Editor contentEditable */}
      <div className="rounded-md border border-slate-300 overflow-hidden">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onPaste={handlePaste}
          className="prose prose-sm max-w-none min-h-[320px] p-3 focus:outline-none focus:ring-2 focus:ring-[#1b4382] bg-white text-slate-800 [&_h1]:text-[#1b4382] [&_h2]:text-[#1b4382] [&_h3]:text-[#1b4382] [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1 [&_hr.pagebreak]:border-[#f37021] [&_hr.pagebreak]:border-t-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#1b4382] [&_blockquote]:bg-slate-50 [&_blockquote]:pl-3 [&_blockquote]:italic"
          data-placeholder="Comece a digitar o handover comercial..."
        />
      </div>

      {/* Histórico de versões */}
      <Card className="bg-slate-50/70 border-slate-200">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <History className="h-3.5 w-3.5 text-slate-500" />
            Histórico de Versões
          </div>
          {loadingVersoes ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando versões...
            </div>
          ) : versoes.length > 0 ? (
            <ul className="space-y-1.5">
              {versoes.map((v, idx) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded hover:bg-slate-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1b4382] text-white text-[10px] font-bold flex-shrink-0">
                      {versoes.length - idx}
                    </span>
                    <span className="text-slate-700 font-medium">
                      {formatarDataHora(v.criado_em) || '—'}
                    </span>
                    {v.criado_por && (
                      <span className="text-slate-500 truncate">por {v.criado_por}</span>
                    )}
                    {idx === 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        Atual
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreviewVersao(v)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[#1b4382] hover:bg-[#1b4382]/10 font-medium flex-shrink-0"
                  >
                    <Eye className="h-3 w-3" /> Visualizar
                  </button>
                </li>
              ))}
            </ul>
          ) : handoverAtualizadoEm ? (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Última atualização:{' '}
                <strong className="text-slate-700">{formatarDataHora(handoverAtualizadoEm)}</strong>
                {handoverAtualizadoPor && (
                  <>
                    {' '}
                    por <strong className="text-slate-700">{handoverAtualizadoPor}</strong>
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Handover ainda não registrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
