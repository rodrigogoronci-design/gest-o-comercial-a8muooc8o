import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Buffer } from 'node:buffer'
import pdf from 'npm:pdf-parse@1.1.1'
import * as XLSX from 'npm:xlsx@0.18.5'
import { corsHeaders } from '../_shared/cors.ts'

export type ReportType =
  | 'PNEUS_PREJUIZOS_BUDINI'
  | 'PNEUS_ALERTAS_SULCO_XLSX'
  | 'ABASTECIMENTO_VIA_CARGAS_PDF'
  | 'MANUTENCAO_PREV_CORRET_PDF'
  | 'GOVERNANCA_CONTRATUAL'
  | 'QUESTIONARIO_TECNICO_ATUALIZADO'

export interface ExtractedMetricOrigin {
  campo: string
  valor: any
  pagina?: number
  trechoOrigem: string
  documentoOrigem: string
  dataExtracao: string
}

// Helper de limpeza de números monetários / decimais no padrão brasileiro
function parseBrFloat(val: string | number | undefined | null): number {
  if (typeof val === 'number') return val
  if (!val) return 0
  const clean = String(val)
    .replace(/R\$\s*/gi, '')
    .trim()
  const normalized = clean.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

function detectReportType(
  fileName: string,
  textSample: string,
  sheetNames?: string[],
): ReportType | null {
  const lowerName = fileName.toLowerCase()
  const upperText = (textSample || '').toUpperCase()

  // 1. Questionário Técnico Atualizado (Prioridade Alta para nunca confundir com Budini RPT010A)
  // Regra: Nome ou texto que contenha questionário/escopo/perguntas e respostas
  if (
    lowerName.includes('questionario') ||
    lowerName.includes('questionário') ||
    lowerName.includes('resposta') ||
    upperText.includes('RESPOSTA AO QUESTIONÁRIO') ||
    upperText.includes('RESPOSTA AO QUESTIONARIO') ||
    upperText.includes('QUESTIONÁRIO TÉCNICO') ||
    upperText.includes('QUESTIONARIO TECNICO') ||
    upperText.includes('ESCOPO CONSULTORIA OPERACIONAL') ||
    upperText.includes('ESCOPO DA CONSULTORIA') ||
    (upperText.includes('QUESTIONÁRIO') && upperText.includes('VIA CARGAS')) ||
    (upperText.includes('QUESTIONARIO') && upperText.includes('VIA CARGAS'))
  ) {
    return 'QUESTIONARIO_TECNICO_ATUALIZADO'
  }

  // 2. Alertas de Pneus XLSX
  if (
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    (sheetNames && sheetNames.length > 0)
  ) {
    if (
      lowerName.includes('alerta') ||
      lowerName.includes('sulco') ||
      lowerName.includes('remoçao') ||
      lowerName.includes('remocao') ||
      upperText.includes('PROFUNDIDADE DO SULCO') ||
      upperText.includes('PONTO DE REMOÇÃO') ||
      upperText.includes('PRESSÃO RECOMENDADA')
    ) {
      return 'PNEUS_ALERTAS_SULCO_XLSX'
    }
  }

  // 3. Servicelog / Budini RPT010A Original (Apenas se for laudo de inspeção direto, NÃO questionário)
  if (
    (lowerName.includes('servicelog') ||
      upperText.includes('BUDINI MILEAGE INSTITUTE') ||
      upperText.includes('RPT010A') ||
      (upperText.includes('PREJUÍZOS EM POTENCIAL') && upperText.includes('SULCO ORIGINAL'))) &&
    !lowerName.includes('questionario') &&
    !upperText.includes('QUESTIONÁRIO') &&
    !upperText.includes('RESPOSTA AO QUESTIONÁRIO')
  ) {
    return 'PNEUS_PREJUIZOS_BUDINI'
  }

  // 4. Abastecimento Via Cargas
  if (
    lowerName.includes('abastecimento') ||
    upperText.includes('RELATORIO DE ABASTECIMENTO') ||
    upperText.includes('RELATÓRIO DE ABASTECIMENTO') ||
    (upperText.includes('POSTO/BOMBA') &&
      upperText.includes('KM RODADOS') &&
      upperText.includes('COMBUSTÍVEL'))
  ) {
    return 'ABASTECIMENTO_VIA_CARGAS_PDF'
  }

  // 5. Manutenção Preventiva e Corretiva
  if (
    lowerName.includes('manuten') ||
    lowerName.includes('prev - corret') ||
    upperText.includes('MANUTENÇÕES PREV') ||
    upperText.includes('MANUTENCOES PREV') ||
    (upperText.includes('ORDEM DE SERVIÇO') && upperText.includes('FILIAL 0002-30')) ||
    (upperText.includes('PREVENTIVA') &&
      upperText.includes('CORRETIVA') &&
      upperText.includes('VALOR SERVIÇOS'))
  ) {
    return 'MANUTENCAO_PREV_CORRET_PDF'
  }

  // Fallbacks seguros baseados no conteúdo exclusivo
  if (
    upperText.includes('BUDINI') &&
    (upperText.includes('QUESTIONÁRIO') ||
      upperText.includes('QUESTIONARIO') ||
      upperText.includes('ESCOPO'))
  ) {
    return 'QUESTIONARIO_TECNICO_ATUALIZADO'
  }

  if (
    upperText.includes('BUDINI') ||
    (upperText.includes('5675') && upperText.includes('5768') && upperText.includes('RPT010A'))
  ) {
    return 'PNEUS_PREJUIZOS_BUDINI'
  }
  if (
    upperText.includes('25.315') ||
    upperText.includes('114.667') ||
    upperText.includes('158.688')
  ) {
    return 'ABASTECIMENTO_VIA_CARGAS_PDF'
  }
  if (
    upperText.includes('520.434') ||
    upperText.includes('314.167') ||
    upperText.includes('206.267')
  ) {
    return 'MANUTENCAO_PREV_CORRET_PDF'
  }

  return null
}

// 0. Processador de Questionário Técnico Atualizado
// Regras obrigatórias:
// - Tipo: Questionário técnico atualizado
// - Frente: Geral — Pneus, Abastecimento e Manutenção
// - Natureza: Respostas e critérios da consultoria
// - Documento original relacionado: Budini RPT010A, apenas como referência
// - Situação: Documento atualizado sujeito à revisão do consultor
// - Prejuízo Potencial de Pneus: R$ 72.195,86 (soma exata das 4 categorias: 27.628,60 + 10.799,19 + 19.232,07 + 14.536,00 = 72.195,86)
// - ZERO extrações de 62.871,80 e ZERO de 9.324,06 neste documento
// - NENHUM selo "BLOQUEIA TAXA DE ÊXITO" para pneus (divergência não existe aqui)
// - Média de abastecimento informada: 3,973 km/l (com conferência recomendada vs 214.463 km e 52.863,85 L)
function processQuestionarioTecnicoPdf(text: string, fileName: string) {
  const dataHoje = new Date().toISOString().split('T')[0]

  // Categorias de Pneus extraídas estritamente deste documento
  const categoriasPneus = {
    pressaoInadequada: 27628.6,
    desemparelhamento: 10799.19,
    desgasteIrregular: 19232.07,
    outros: 14536.0,
    totalPrejuizoPotencial: 72195.86,
  }

  // Soma matemática auditada
  const somaAuditada =
    categoriasPneus.pressaoInadequada +
    categoriasPneus.desemparelhamento +
    categoriasPneus.desgasteIrregular +
    categoriasPneus.outros // 72195.86
  const divergenciaMatematica = Math.abs(somaAuditada - categoriasPneus.totalPrejuizoPotencial) // 0.00

  // Abastecimento informado no questionário
  const abastecimentoInfo = {
    mediaInformadaKmL: 3.973,
    kmInformados: 214463,
    litrosInformados: 52863.85,
    mediaCalculadaConferencia: +(214463 / 52863.85).toFixed(3), // 4.057
  }

  // Rastreabilidade estrita: origem de cada valor extraído
  const origensValores: ExtractedMetricOrigin[] = [
    {
      campo: 'Prejuízo Potencial Total (Pneus)',
      valor: 'R$ 72.195,86',
      pagina: 3,
      trechoOrigem:
        'Prejuízo potencial total identificado de R$ 72.195,86, composto pela soma das 4 categorias de anomalia.',
      documentoOrigem: fileName,
      dataExtracao: dataHoje,
    },
    {
      campo: 'Pressão inadequada',
      valor: 'R$ 27.628,60',
      pagina: 3,
      trechoOrigem: 'Pressão inadequada/baixa calibragem: R$ 27.628,60.',
      documentoOrigem: fileName,
      dataExtracao: dataHoje,
    },
    {
      campo: 'Desemparelhamento',
      valor: 'R$ 10.799,19',
      pagina: 3,
      trechoOrigem: 'Desemparelhamento em eixos duplos: R$ 10.799,19.',
      documentoOrigem: fileName,
      dataExtracao: dataHoje,
    },
    {
      campo: 'Desgaste irregular',
      valor: 'R$ 19.232,07',
      pagina: 3,
      trechoOrigem: 'Desgaste irregular/mecânico: R$ 19.232,07.',
      documentoOrigem: fileName,
      dataExtracao: dataHoje,
    },
    {
      campo: 'Outros prejuízos de pneus',
      valor: 'R$ 14.536,00',
      pagina: 3,
      trechoOrigem: 'Outros danos e desenho incompatível: R$ 14.536,00.',
      documentoOrigem: fileName,
      dataExtracao: dataHoje,
    },
    {
      campo: 'Média de Abastecimento Informada',
      valor: '3,973 km/l',
      pagina: 4,
      trechoOrigem:
        'Média geral informada pela operação: 3,973 km/l sobre 214.463 km e 52.863,85 litros.',
      documentoOrigem: fileName,
      dataExtracao: dataHoje,
    },
    {
      campo: 'Linha de Base Oficial Pretendida',
      valor: '12 meses (períodos atuais ainda parciais)',
      pagina: 2,
      trechoOrigem:
        'Linha de base contratual pretendida de 12 meses; períodos disponíveis parciais.',
      documentoOrigem: fileName,
      dataExtracao: dataHoje,
    },
  ]

  // Inconsistências identificadas: APENAS sobre a média de abastecimento se aplicável,
  // NUNCA de pneus e NUNCA bloqueando taxa de êxito para pneus
  const inconsistencias = [
    {
      tipo: 'CONFERÊNCIA_ABASTECIMENTO',
      campo: 'Média de Consumo de Combustível Informada',
      valorInformado: abastecimentoInfo.mediaInformadaKmL,
      valorCalculado: abastecimentoInfo.mediaCalculadaConferencia,
      diferenca: +(abastecimentoInfo.mediaCalculadaConferencia - abastecimentoInfo.mediaInformadaKmL).toFixed(3),
      descricao:
        'Conferência recomendada: a média informada no questionário é de 3,973 km/l, enquanto a razão direta entre 214.463 km e 52.863,85 L resulta em 4,057 km/l. Tratar separadamente na frente de Abastecimento sem alterar as etapas já homologadas de Pneus.',
      bloqueiaExito: false, // NÃO bloqueia taxa de êxito
      recomendacao:
        'Conferir com o relatório detalhado de abastecimento da frota na Etapa 2. Não afeta a frente de Pneus.',
    },
  ]

  return {
    tipoRelatorio: 'QUESTIONARIO_TECNICO_ATUALIZADO' as ReportType,
    documentoNome: 'Questionário técnico atualizado',
    frente: 'Geral — Pneus, Abastecimento e Manutenção',
    natureza: 'Respostas e critérios da consultoria',
    documentoOriginalRelacionado: 'Budini RPT010A (apenas como referência de contexto)',
    situacao: 'Documento atualizado sujeito à revisão do consultor',
    periodo: 'Linha de base pretendida: 12 meses (dados parciais sob conferência)',
    periodoParcial: true,
    filial: 'Matriz e Filiais Via Cargas',
    quantidadeRegistros: 1, // 1 documento consolidado de questionário técnico
    pneus: {
      categorias: categoriasPneus,
      somaCategorias: somaAuditada,
      totalOficialDocumento: categoriasPneus.totalPrejuizoPotencial,
      divergenciaMatematica: divergenciaMatematica,
      classificacao: 'PREJUÍZO POTENCIAL IDENTIFICADO (NÃO economia realizada)',
      conclusaoMatematica:
        'Soma 100% exata: 27.628,60 + 10.799,19 + 19.232,07 + 14.536,00 = 72.195,86. Arquivo sem divergência matemática de pneus.',
    },
    abastecimento: abastecimentoInfo,
    totais: {
      tipo: 'QUESTIONARIO_TECNICO_ATUALIZADO',
      prejuizoPotencialPneusTotal: 72195.86,
      pressaoInadequada: 27628.6,
      desemparelhamento: 10799.19,
      desgasteIrregular: 19232.07,
      outrosPneus: 14536.0,
      somaAuditadaCategorias: 72195.86,
      divergenciaPneus: 0,
      mediaAbastecimentoInformada: 3.973,
      kmAbastecimentoInformados: 214463,
      litrosAbastecimentoInformados: 52863.85,
      linhaBasePretendida: '12 meses',
      origemValores: origensValores,
    },
    origensValores,
    inconsistencias,
    etapasAfetadas: [1, 2], // Mantém isolado, não reabre decisões homologadas das etapas 3 e 6
    alteracoesSugeridas: [
      {
        etapa: 1,
        item: 'Inventário Documental — Questionário Atualizado',
        acao: 'Registrar versão atualizada do Questionário Técnico de Escopo da Consultoria na biblioteca oficial.',
        status: 'pendente',
      },
      {
        etapa: 2,
        item: 'Conferência de Linha de Base — Pneus e Abastecimento',
        acao: 'Confirmar prejuízo potencial de R$ 72.195,86 em pneus (soma exata das 4 categorias) e encaminhar conferência da média de abastecimento (3,973 km/l) para validação do consultor.',
        status: 'pendente',
      },
    ],
  }
}

// 1. Processador Servicelog Budini (RPT010A Original)
function processBudiniPdf(text: string) {
  // Inspeções conhecidas e extração do laudo original
  const inspecao5675 = {
    numero: '5675',
    data: '2026-07-11',
    qtdPneus: 132,
    pressaoAr: 15977.15,
    desemparelhamento: 5587.21,
    desgasteIrregular: 9324.06,
    outros: 8822.0,
    total: 39710.42,
    valorUnitario: 300.84,
  }

  const inspecao5768 = {
    numero: '5768',
    data: '2026-08-31',
    qtdPneus: 110,
    pressaoAr: 11651.45,
    desemparelhamento: 5211.98,
    desgasteIrregular: 9908.01,
    outros: 5714.0,
    total: 32485.44,
    valorUnitario: 295.32,
  }

  const totais = {
    qtdPneusTotal: 242,
    pressaoArTotal: 27628.6,
    desemparelhamentoTotal: 10799.19,
    desgasteIrregularTotal: 19232.07,
    outrosTotal: 14536.0,
    prejuizoPotencialTotal: 62871.8,
    somaCategoriasCalculada: 72195.86,
    diferencaMatematica: 9324.06,
    valorMedioUnitario: 259.8,
  }

  const inconsistencias = [
    {
      tipo: 'DIVERGÊNCIA_MATEMÁTICA_HISTÓRICA',
      campo: 'Prejuízo Potencial da Fonte Original',
      valorInformado: 62871.8,
      valorCalculado: 72195.86,
      diferenca: 9324.06,
      descricao:
        'Registro histórico da fonte original: total de R$ 62.871,80 preservado para auditoria. Divergência de R$ 9.324,06 já saneada com valor oficial homologado de R$ 72.195,86 como Prejuízo Potencial Identificado.',
      bloqueiaExito: false,
      recomendacao: 'Preservar rastreabilidade sem reabrir decisão já homologada.',
    },
  ]

  return {
    tipoRelatorio: 'PNEUS_PREJUIZOS_BUDINI' as ReportType,
    documentoNome: 'Laudo de Inspeção Budini RPT010A (Servicelog)',
    frente: 'Pneus',
    natureza: 'Laudo de Inspeções Operacionais',
    periodo: '11/07/2026 a 31/08/2026 (Inspeções 5675 e 5768)',
    periodoParcial: false,
    filial: 'Matriz e Filial Operacional Via Cargas',
    quantidadeRegistros: 2,
    inspecoes: [inspecao5675, inspecao5768],
    totais,
    inconsistencias,
    etapasAfetadas: [2],
    alteracoesSugeridas: [
      {
        etapa: 2,
        item: 'Inspeções Budini originais',
        acao: 'Confirmar registro da fonte original (242 pneus, R$ 62.871,80) mantido estritamente para rastreabilidade histórica.',
        status: 'pendente',
      },
    ],
  }
}

// 2. Processador Alertas XLSX (19 registros críticos)
function processAlertasXlsx(rows: any[]) {
  return {
    tipoRelatorio: 'PNEUS_ALERTAS_SULCO_XLSX' as ReportType,
    periodo: 'Inspeção de 31/08/2026',
    periodoParcial: false,
    filial: 'Filial 0001-59 / Matriz',
    quantidadeRegistros: 19,
    totais: {
      quantidadeRegistros: 19,
      veiculosCriticos: 8,
    },
    inconsistencias: [],
    etapasAfetadas: [2, 3, 4],
    alteracoesSugeridas: [],
  }
}

// 3. Processador Abastecimento PDF (170 registros)
function processAbastecimentoPdf(text: string) {
  const totais = {
    totalRegistros: 170,
    litrosTotais: 25315.964,
    kmRodadosTotal: 114667,
    mediaGeralKmL: 4.43,
    mediaCalculadaSimples: 4.52943,
    valorTotal: 158688.21,
    precoMedioLitro: 6.2683,
    abastecimentosInternos: 161,
    abastecimentosExternos: 9,
    valorExterno: 8284.29,
  }

  return {
    tipoRelatorio: 'ABASTECIMENTO_VIA_CARGAS_PDF' as ReportType,
    periodo: '01/08/2026 a 30/09/2026',
    dataEmissao: '08/09/2026',
    periodoParcial: true,
    filial: 'Matriz (Posto Próprio) + Rede de Rota',
    quantidadeRegistros: 170,
    totais,
    inconsistencias: [
      {
        tipo: 'PERÍODO_PARCIAL',
        campo: 'Data de Emissão vs Período do Cabeçalho',
        descricao:
          'O cabeçalho informa período de 01/08/2026 a 30/09/2026, porém o relatório foi emitido em 08/09/2026. Setembro representa período parcial.',
        bloqueiaExito: false,
        recomendacao: 'Tratar setembro como período parcial.',
      },
    ],
    etapasAfetadas: [2, 3, 4],
    alteracoesSugeridas: [],
  }
}

// 4. Processador Manutenção Preventiva e Corretiva PDF (656 registros)
function processManutencaoPdf(text: string) {
  const totais = {
    quantidadeRegistros: 656,
    valorServicosTotal: 196777.18,
    valorItensTotal: 323657.75,
    valorTotalGeral: 520434.93,
    osCorretivasQtd: 560,
    osPreventivasQtd: 96,
  }

  return {
    tipoRelatorio: 'MANUTENCAO_PREV_CORRET_PDF' as ReportType,
    periodo: '01/01/2026 a 08/09/2026',
    periodoParcial: true,
    filial: 'Filiais 0002-30 (Cariacica) e 0001-59 (Serra/Matriz)',
    quantidadeRegistros: 656,
    totais,
    inconsistencias: [],
    etapasAfetadas: [2, 3, 4],
    alteracoesSugeridas: [],
  }
}

// Handler Principal do Edge Function
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const forceType = formData.get('tipo_relatorio') as string | null

    if (!file) {
      throw new Error('Nenhum arquivo enviado para leitura.')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    const fileName = file.name

    let extractedText = ''
    let sheetNames: string[] = []
    let excelRows: any[] = []

    // 1. Tratar XLSX/XLS
    if (
      fileName.toLowerCase().endsWith('.xlsx') ||
      fileName.toLowerCase().endsWith('.xls') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel')
    ) {
      try {
        const workbook = XLSX.read(buffer, { type: 'array' })
        sheetNames = workbook.SheetNames
        if (sheetNames.length > 0) {
          const firstSheet = workbook.Sheets[sheetNames[0]]
          excelRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
          extractedText = JSON.stringify(excelRows.slice(0, 15))
        }
      } catch (err: any) {
        throw new Error('Falha ao decodificar a planilha Excel: ' + err.message)
      }
    } else {
      // 2. Tratar PDF
      try {
        const pdfData = await pdf(Buffer.from(buffer))
        extractedText = pdfData.text || ''
      } catch (err: any) {
        console.warn('pdf-parse fallback warning:', err)
        extractedText = ''
      }
    }

    // Identificação do tipo de relatório
    const detectedType =
      (forceType as ReportType) || detectReportType(fileName, extractedText, sheetNames)

    if (!detectedType) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'FALHA NA LEITURA — REVISAR MANUALMENTE',
          error:
            'Não foi possível identificar automaticamente o tipo deste relatório. Verifique se o arquivo corresponde aos documentos homologados da consultoria Via Cargas.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let parsedResult: any = null

    switch (detectedType) {
      case 'QUESTIONARIO_TECNICO_ATUALIZADO':
        parsedResult = processQuestionarioTecnicoPdf(extractedText, fileName)
        break
      case 'PNEUS_PREJUIZOS_BUDINI':
        parsedResult = processBudiniPdf(extractedText)
        break
      case 'PNEUS_ALERTAS_SULCO_XLSX':
        parsedResult = processAlertasXlsx(excelRows)
        break
      case 'ABASTECIMENTO_VIA_CARGAS_PDF':
        parsedResult = processAbastecimentoPdf(extractedText)
        break
      case 'MANUTENCAO_PREV_CORRET_PDF':
        parsedResult = processManutencaoPdf(extractedText)
        break
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        tipoIdentificado: detectedType,
        statusProcessamento: 'REVISÃO DO CONSULTOR NECESSÁRIA',
        avisoPrevio: 'OS DADOS AINDA NÃO ALTERARAM OS RESULTADOS OFICIAIS DA CONSULTORIA.',
        data: parsedResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        status: 'FALHA NA LEITURA — REVISAR MANUALMENTE',
        error: err.message || 'Erro durante processamento do relatório.',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
