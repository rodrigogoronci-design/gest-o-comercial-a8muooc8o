import logoUrl from '@/assets/logomarca-service-ea011.png'

/**
 * Parser de markdown simples → HTML para o campo Handover Comercial.
 * Suporta: títulos (#, ##, ###), listas (- ou *), negrito (**texto**),
 * parágrafos (separados por linha em branco) e quebras de linha simples.
 *
 * Escape de HTML é feito primeiro para evitar injeção no documento do PDF.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function applyInline(text: string): string {
  // Negrito **texto**
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/** Converte o texto markdown do campo Handover em HTML seguro para o PDF. */
export function renderHandoverMarkdown(md: string): string {
  if (!md || !md.trim()) {
    return '<p class="hc-empty">Nenhum conteúdo de handover registrado.</p>'
  }

  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let i = 0

  const flushParagraph = (buf: string[]) => {
    if (buf.length === 0) return
    const content = buf.join(' ').trim()
    if (content) {
      blocks.push(`<p>${applyInline(content)}</p>`)
    }
    buf.length = 0
  }

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()

    // Linha em branco → fecha parágrafo
    if (line.trim() === '') {
      // não há buffer aberto aqui pois tratamos parágrafos inline; pular
      i++
      continue
    }

    // Títulos
    const h3 = line.match(/^###\s+(.*)$/)
    if (h3) {
      blocks.push(`<h3>${applyInline(escapeHtml(h3[1]))}</h3>`)
      i++
      continue
    }
    const h2 = line.match(/^##\s+(.*)$/)
    if (h2) {
      blocks.push(`<h2>${applyInline(escapeHtml(h2[1]))}</h2>`)
      i++
      continue
    }
    const h1 = line.match(/^#\s+(.*)$/)
    if (h1) {
      blocks.push(`<h2 class="hc-h1">${applyInline(escapeHtml(h1[1]))}</h2>`)
      i++
      continue
    }

    // Listas (bullets)
    const bulletMatch = line.match(/^[-*]\s+(.*)$/)
    if (bulletMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const bLine = lines[i].trim()
        const m = bLine.match(/^[-*]\s+(.*)$/)
        if (!m) break
        items.push(`<li>${applyInline(escapeHtml(m[1]))}</li>`)
        i++
      }
      blocks.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // Lista numerada (1. 2. 3.)
    const numMatch = line.match(/^\d+\.\s+(.*)$/)
    if (numMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const bLine = lines[i].trim()
        const m = bLine.match(/^\d+\.\s+(.*)$/)
        if (!m) break
        items.push(`<li>${applyInline(escapeHtml(m[1]))}</li>`)
        i++
      }
      blocks.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    // Parágrafo: agrupar linhas consecutivas até linha em branco ou bloco especial
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,3}\s+/) &&
      !lines[i].match(/^[-*]\s+/) &&
      !lines[i].match(/^\d+\.\s+/)
    ) {
      buf.push(escapeHtml(lines[i].trim()))
      i++
    }
    flushParagraph(buf)
  }

  return blocks.join('\n')
}

export interface HandoverPdfData {
  cliente: string
  projeto: string
  responsavelComercial: string
  responsavelExecucao: string
  status: string
  conteudo: string
}

function formatarDataPTBR(date: Date): string {
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const ano = date.getFullYear()
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
  return `${dia} de ${meses[date.getMonth()]} de ${ano}`
}

/** CSS inline do documento Handover — mesma identidade visual do contrato. */
const HANDOVER_CSS = `
  @page {
    size: A4;
    margin: 25mm 20mm 20mm 30mm;
    @bottom-right {
      content: 'Página ' counter(page) ' de ' counter(pages);
      font-family: 'Times New Roman', 'Liberation Serif', Georgia, serif;
      font-size: 9pt;
      color: #64748b;
    }
    @bottom-left {
      content: 'ServiceLogic — Handover Comercial';
      font-family: 'Times New Roman', 'Liberation Serif', Georgia, serif;
      font-size: 9pt;
      color: #94a3b8;
    }
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
    font-size: 12pt;
    line-height: 1.5;
    color: #1e293b;
    padding: 25mm 20mm 20mm 30mm;
    max-width: 210mm;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .hc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 8px;
    margin-bottom: 14pt;
    border-bottom: 2px solid #f37021;
    break-after: avoid;
    page-break-after: avoid;
  }
  .hc-header img.hc-logo {
    height: 40px;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
  }
  .hc-header h1 {
    font-size: 13pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #1b4382;
    text-align: right;
    line-height: 1.25;
    margin: 0;
    flex: 1;
    letter-spacing: 0.3px;
  }

  .hc-info-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 16pt 0;
    font-size: 10.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .hc-info-table td {
    border: 0.5pt solid #cbd5e1;
    padding: 5pt 8pt;
    vertical-align: top;
  }
  .hc-info-table .hc-label {
    font-weight: 700;
    color: #1b4382;
    text-transform: uppercase;
    font-size: 9pt;
    letter-spacing: 0.3px;
    background: #f8fafc;
    width: 38mm;
    white-space: nowrap;
  }
  .hc-info-table .hc-value {
    color: #1e293b;
  }

  .hc-body h2 {
    font-size: 12pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #1b4382;
    letter-spacing: 0.3px;
    margin: 16pt 0 6pt 0;
    padding-bottom: 2pt;
    border-bottom: 0.5pt solid rgba(27,67,130,0.35);
    break-after: avoid;
    page-break-after: avoid;
  }
  .hc-body h2.hc-h1 {
    font-size: 13pt;
    border-bottom: 2pt solid #f37021;
    padding-bottom: 3pt;
  }
  .hc-body h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #1b4382;
    margin: 12pt 0 4pt 0;
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
    margin: 4pt 0 6pt 8mm;
    padding-left: 5mm;
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

  .hc-section-title {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #1b4382;
    letter-spacing: 0.4px;
    margin: 18pt 0 8pt 0;
    padding-bottom: 2pt;
    border-bottom: 1.5pt solid #f37021;
    break-after: avoid;
    page-break-after: avoid;
  }

  .hc-footer-screen {
    margin-top: 20mm;
    padding-top: 5mm;
    border-top: 1px solid #e2e8f0;
    text-align: right;
    font-size: 9pt;
    color: #94a3b8;
  }

  @media print {
    body {
      padding: 0 !important;
      max-width: none !important;
      margin: 0 !important;
      font-size: 11pt;
      line-height: 1.45;
      color: #000 !important;
    }
    .hc-header {
      display: flex !important;
      break-after: avoid;
      page-break-after: avoid;
      padding-bottom: 8px !important;
      margin-bottom: 14pt !important;
      border-bottom: 2px solid #f37021 !important;
    }
    .hc-header img.hc-logo {
      height: 40px !important;
      max-height: 40px !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .hc-header h1 {
      color: #1b4382 !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .hc-footer-screen { display: none !important; }
    .hc-no-print { display: none !important; }
  }
`

/**
 * Abre uma nova janela/aba com o documento Handover formatado para impressão.
 * Mesma identidade visual do contrato de consultoria (borda laranja, azul
 * institucional, Times New Roman, margens A4, rodapé com paginação).
 *
 * NÃO usa iframe — usa window.open com documento HTML autossuficiente.
 */
export function openHandoverPdf(data: HandoverPdfData): void {
  const now = new Date()
  const corpoHtml = renderHandoverMarkdown(data.conteudo)

  const infoRows = [
    { label: 'Cliente', value: data.cliente || '—' },
    { label: 'Projeto', value: data.projeto || '—' },
    { label: 'Responsável Comercial', value: data.responsavelComercial || '—' },
    { label: 'Responsável pela Execução', value: data.responsavelExecucao || '—' },
    { label: 'Data', value: formatarDataPTBR(now) },
    { label: 'Status', value: data.status || '—' },
  ]
    .map(
      (r) =>
        `<tr><td class="hc-label">${escapeHtml(r.label)}</td><td class="hc-value">${escapeHtml(
          r.value,
        )}</td></tr>`,
    )
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Handover Comercial — ${escapeHtml(data.cliente || 'Consultoria')}</title>
  <style>${HANDOVER_CSS}</style>
</head>
<body>
  <div class="hc-header">
    <img class="hc-logo" src="${logoUrl}" alt="Service Logic" />
    <h1>Handover Comercial &rarr; Execução</h1>
  </div>

  <table class="hc-info-table">
    ${infoRows}
  </table>

  <div class="hc-section-title">Conteúdo do Handover</div>
  <div class="hc-body">
    ${corpoHtml}
  </div>

  <div class="hc-footer-screen">Documento gerado por ServiceLogic — Handover Comercial</div>

  <script>
    (function () {
      function printNow() {
        try { window.focus(); window.print(); } catch { /* intentionally ignored */ }
      }
      var imgs = Array.prototype.slice.call(document.images).filter(function (img) { return !img.complete; });
      if (imgs.length === 0) {
        // Aguarda um pequeno delay para o navegador renderizar antes de imprimir
        setTimeout(printNow, 150);
        return;
      }
      var remaining = imgs.length;
      function onDone() {
        remaining -= 1;
        if (remaining <= 0) setTimeout(printNow, 150);
      }
      imgs.forEach(function (img) {
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
      });
    })();
  </script>
</body>
</html>`

  const win = window.open('', '_blank', 'noopener')
  if (!win) {
    // Popup bloqueado
    throw new Error('Pop-up bloqueado pelo navegador. Permita pop-ups para gerar o PDF.')
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
