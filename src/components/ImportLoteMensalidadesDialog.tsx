import { useState, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  Download,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  FileCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  parseUploadFile,
  extractMensalidadeRows,
  buildPreviaAtualizacao,
  applyAtualizacaoMensalidades,
  type PreviaLinha,
  type PreviaResumo,
  type ResultadoExecucaoGeral,
} from '@/services/lote-mensalidades'
import { exportRelatorioAtualizacaoToExcel } from '@/services/export-relatorio-lote-mensalidades'

interface ImportLoteMensalidadesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type Etapa = 'upload' | 'previa' | 'processando' | 'relatorio'

export function ImportLoteMensalidadesDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportLoteMensalidadesDialogProps) {
  const [etapa, setEtapa] = useState<Etapa>('upload')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [isReadingFile, setIsReadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Prévia
  const [previa, setPrevia] = useState<PreviaLinha[]>([])
  const [resumo, setResumo] = useState<PreviaResumo | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'divergencia' | 'sem_match' | 'invalido' | 'selecionados'
  >('todos')
  const [buscaTexto, setBuscaTexto] = useState('')

  // Confirmação de execução
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [progresso, setProgresso] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  })

  // Relatório Final
  const [resultado, setResultado] = useState<ResultadoExecucaoGeral | null>(null)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Reset de estado ao fechar ou reiniciar
  const handleReset = () => {
    setEtapa('upload')
    setArquivo(null)
    setIsReadingFile(false)
    setPrevia([])
    setResumo(null)
    setFiltroStatus('todos')
    setBuscaTexto('')
    setIsConfirmOpen(false)
    setProgresso({ current: 0, total: 0 })
    setResultado(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChangeInternal = (newOpen: boolean) => {
    if (!newOpen && etapa === 'processando') {
      // Bloquear fechamento acidental durante a gravação
      toast.warning('Aguarde a conclusão da atualização em lote.')
      return
    }
    if (!newOpen) {
      handleReset()
    }
    onOpenChange(newOpen)
  }

  // ETAPA 1: Processar arquivo submetido
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivo(file)
    setIsReadingFile(true)

    try {
      const rawMatrix = await parseUploadFile(file)
      if (rawMatrix.length < 2) {
        throw new Error(
          'O arquivo selecionado está vazio ou não possui linhas de dados com cabeçalho.',
        )
      }

      const parsedRows = extractMensalidadeRows(rawMatrix)
      if (parsedRows.length === 0) {
        throw new Error(
          'Nenhuma linha de cliente foi encontrada. Verifique se o arquivo possui as colunas esperadas (CNPJ, Cliente Skip, Valor atual R$, Novo valor R$).',
        )
      }

      const { previa: previaCalculada, resumo: resumoCalculado } =
        await buildPreviaAtualizacao(parsedRows)

      setPrevia(previaCalculada)
      setResumo(resumoCalculado)
      setEtapa('previa')
      toast.success(`${parsedRows.length} linhas lidas do arquivo. Prévia gerada com sucesso!`)
    } catch (err: any) {
      console.error('Erro ao ler arquivo de mensalidades:', err)
      toast.error(err.message || 'Erro ao processar o arquivo. Verifique o formato.')
      setArquivo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setIsReadingFile(false)
    }
  }

  // Manipulação de seleção linha a linha
  const handleToggleLinha = (id: string) => {
    setPrevia((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id && item.status === 'correspondido') {
          return { ...item, selecionado: !item.selecionado }
        }
        return item
      })
      // Recalcular totais dinamicamente
      recalcResumo(updated)
      return updated
    })
  }

  const handleToggleTodos = (selecionarTodos: boolean) => {
    setPrevia((prev) => {
      const updated = prev.map((item) => {
        if (item.status === 'correspondido') {
          return { ...item, selecionado: selecionarTodos }
        }
        return item
      })
      recalcResumo(updated)
      return updated
    })
  }

  const recalcResumo = (itens: PreviaLinha[]) => {
    let totalCorrespondidos = 0
    let totalDivergencias = 0
    let totalSemCorrespondencia = 0
    let totalFalhasCnpj = 0
    let totalSelecionados = 0
    let somaAtualSistemaSelecionados = 0
    let somaNovoArquivoSelecionados = 0

    for (const item of itens) {
      if (item.status === 'correspondido') {
        totalCorrespondidos++
        if (item.temDivergenciaValorAtual) totalDivergencias++
        if (item.selecionado) {
          totalSelecionados++
          somaAtualSistemaSelecionados += item.mensalidadeAtualSistema || 0
          somaNovoArquivoSelecionados += item.novoValorArquivo || 0
        }
      } else if (item.status === 'sem_correspondencia') {
        totalSemCorrespondencia++
      } else if (item.status === 'cnpj_invalido') {
        totalFalhasCnpj++
      }
    }

    setResumo({
      totalLinhas: itens.length,
      totalCorrespondidos,
      totalDivergencias,
      totalSemCorrespondencia,
      totalFalhasCnpj,
      totalSelecionados,
      somaAtualSistemaSelecionados,
      somaNovoArquivoSelecionados,
    })
  }

  // Filtragem na prévia
  const previaFiltrada = useMemo(() => {
    return previa.filter((item) => {
      // Filtro de status
      if (filtroStatus === 'divergencia' && !item.temDivergenciaValorAtual) return false
      if (filtroStatus === 'sem_match' && item.status !== 'sem_correspondencia') return false
      if (filtroStatus === 'invalido' && item.status !== 'cnpj_invalido') return false
      if (filtroStatus === 'selecionados' && !item.selecionado) return false

      // Busca texto
      if (buscaTexto.trim()) {
        const query = buscaTexto.toLowerCase().trim()
        const matchCnpj =
          item.cnpjOriginal.toLowerCase().includes(query) || item.cnpjNormalizado.includes(query)
        const matchNomeArq = item.clienteArquivo.toLowerCase().includes(query)
        const matchNomeSis = (item.clienteNomeSistema || '').toLowerCase().includes(query)
        if (!matchCnpj && !matchNomeArq && !matchNomeSis) return false
      }

      return true
    })
  }, [previa, filtroStatus, buscaTexto])

  // ETAPA 2: Aplicar atualização
  const handleExecutarAtualizacao = async () => {
    setIsConfirmOpen(false)
    setEtapa('processando')
    setProgresso({ current: 0, total: previa.length })

    try {
      const res = await applyAtualizacaoMensalidades(previa, (current, total) => {
        setProgresso({ current, total })
      })

      setResultado(res)
      setEtapa('relatorio')
      toast.success(`${res.totalSucesso} mensalidades foram atualizadas com sucesso!`)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Erro na aplicação do lote:', err)
      toast.error('Erro durante o processamento: ' + err.message)
      setEtapa('previa')
    }
  }

  // Exportar Excel
  const handleExportExcel = async () => {
    if (!resultado) return
    setIsExportingExcel(true)
    try {
      await exportRelatorioAtualizacaoToExcel(resultado)
      toast.success('Relatório Excel exportado com sucesso!')
    } catch (err: any) {
      console.error('Erro ao gerar Excel:', err)
      toast.error('Falha ao exportar relatório em Excel: ' + err.message)
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
          {/* Header da Janela */}
          <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                  Atualização em Lote de Mensalidades
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  Importe a planilha para atualizar exclusivamente o valor da mensalidade dos
                  clientes correspondidos por CNPJ.
                </DialogDescription>
              </div>

              {/* Indicador de Etapas */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
                <span
                  className={`px-3 py-1 rounded-full ${
                    etapa === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  1. Envio do Arquivo
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span
                  className={`px-3 py-1 rounded-full ${
                    etapa === 'previa' || etapa === 'processando'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  2. Prévia & Conferência
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span
                  className={`px-3 py-1 rounded-full ${
                    etapa === 'relatorio'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  3. Relatório Final
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* CONTEÚDO PRINCIPAL POR ETAPA */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* ETAPA 1: UPLOAD */}
            {etapa === 'upload' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-xl w-full bg-white border-2 border-dashed border-indigo-200 rounded-xl p-10 flex flex-col items-center justify-center shadow-sm">
                  <div className="h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Selecione o arquivo de atualização
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Formatos suportados: <strong>.CSV</strong> (separador ponto-e-vírgula ou
                    vírgula) e <strong>.XLSX</strong>.
                    <br />O arquivo deve conter as colunas:{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-700">
                      CNPJ; Cliente Skip; Valor atual R$; Novo valor R$
                    </code>
                    .
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleFileSelected}
                    disabled={isReadingFile}
                  />

                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadingFile}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  >
                    {isReadingFile ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Lendo e analisando arquivo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Escolher Arquivo do Computador
                      </>
                    )}
                  </Button>

                  <div className="mt-8 text-left bg-slate-50 border border-slate-200 rounded-lg p-4 w-full text-xs text-slate-600 space-y-1.5">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      Regras de Processamento Seguro:
                    </p>
                    <p>
                      • O matching é feito exclusivamente pelo <strong>CNPJ</strong> (14 dígitos).
                    </p>
                    <p>
                      • Linhas com CNPJ inválido ou sem correspondência no cadastro{' '}
                      <strong>não alteram nenhum registro</strong>.
                    </p>
                    <p>
                      • Apenas o <strong>Valor da Mensalidade</strong> é atualizado; contratos,
                      planos e módulos permanecem intactos.
                    </p>
                    <p>
                      • O histórico anterior é registrado com trilha de auditoria para fins de
                      compliance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: PRÉVIA */}
            {etapa === 'previa' && resumo && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Cards de Resumo no Topo */}
                <div className="bg-white p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Total de Linhas</div>
                    <div className="text-2xl font-bold text-slate-800 mt-0.5">
                      {resumo.totalLinhas}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">no arquivo enviado</div>
                  </div>

                  <div
                    onClick={() =>
                      setFiltroStatus(filtroStatus === 'selecionados' ? 'todos' : 'selecionados')
                    }
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      filtroStatus === 'selecionados'
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                        : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="text-xs text-emerald-800 font-medium flex items-center justify-between">
                      <span>Correspondidos</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 mt-0.5">
                      {resumo.totalCorrespondidos}
                    </div>
                    <div className="text-[11px] text-emerald-600/90 mt-1">
                      {resumo.totalSelecionados} selecionados para gravar
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setFiltroStatus(filtroStatus === 'divergencia' ? 'todos' : 'divergencia')
                    }
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      filtroStatus === 'divergencia'
                        ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <div className="text-xs text-amber-800 font-medium flex items-center justify-between">
                      <span>Divergência de Valor</span>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-800 mt-0.5">
                      {resumo.totalDivergencias}
                    </div>
                    <div className="text-[11px] text-amber-700/80 mt-1">
                      arquivo ≠ sistema atual
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setFiltroStatus(filtroStatus === 'sem_match' ? 'todos' : 'sem_match')
                    }
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      filtroStatus === 'sem_match'
                        ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-300'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200/70'
                    }`}
                  >
                    <div className="text-xs text-slate-700 font-medium flex items-center justify-between">
                      <span>Sem Correspondência</span>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-700 mt-0.5">
                      {resumo.totalSemCorrespondencia}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">não existem no banco</div>
                  </div>

                  <div
                    onClick={() =>
                      setFiltroStatus(filtroStatus === 'invalido' ? 'todos' : 'invalido')
                    }
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      filtroStatus === 'invalido'
                        ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-300'
                        : 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <div className="text-xs text-rose-800 font-medium flex items-center justify-between">
                      <span>CNPJ Inválido</span>
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                    <div className="text-2xl font-bold text-rose-700 mt-0.5">
                      {resumo.totalFalhasCnpj}
                    </div>
                    <div className="text-[11px] text-rose-600/90 mt-1">
                      malformado ou incompleto
                    </div>
                  </div>
                </div>

                {/* Barra de Filtros e Busca */}
                <div className="p-3 px-6 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative w-full">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar por CNPJ ou nome do cliente..."
                        value={buscaTexto}
                        onChange={(e) => setBuscaTexto(e.target.value)}
                        className="pl-9 bg-white h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">Exibir:</span>
                    <Button
                      variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('todos')}
                      className="h-8 text-xs"
                    >
                      Todos ({resumo.totalLinhas})
                    </Button>
                    <Button
                      variant={filtroStatus === 'divergencia' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('divergencia')}
                      className="h-8 text-xs"
                    >
                      Com Divergência ({resumo.totalDivergencias})
                    </Button>
                    <Button
                      variant={filtroStatus === 'sem_match' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('sem_match')}
                      className="h-8 text-xs"
                    >
                      Sem Correspondência ({resumo.totalSemCorrespondencia})
                    </Button>
                    <Button
                      variant={filtroStatus === 'invalido' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus('invalido')}
                      className="h-8 text-xs"
                    >
                      CNPJ Inválido ({resumo.totalFalhasCnpj})
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleTodos(true)}
                      className="h-8 text-xs text-indigo-700 hover:bg-indigo-50"
                    >
                      Marcar todos válidos
                    </Button>
                    <span className="text-slate-300">|</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleTodos(false)}
                      className="h-8 text-xs text-slate-600 hover:bg-slate-200"
                    >
                      Desmarcar todos
                    </Button>
                  </div>
                </div>

                {/* Tabela de Prévia Rolável */}
                <div className="flex-1 overflow-auto bg-white">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-sm">
                      <TableRow>
                        <TableHead className="w-12 text-center">
                          <span className="sr-only">Seleção</span>
                        </TableHead>
                        <TableHead className="w-14 text-center">Linha</TableHead>
                        <TableHead className="w-40">CNPJ</TableHead>
                        <TableHead className="min-w-[200px]">Cliente no Arquivo</TableHead>
                        <TableHead className="min-w-[200px]">Cliente no Sistema</TableHead>
                        <TableHead className="w-32 text-right">Atual no Sistema</TableHead>
                        <TableHead className="w-32 text-right">Novo no Arquivo</TableHead>
                        <TableHead className="w-32 text-center">Divergência</TableHead>
                        <TableHead className="w-36 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previaFiltrada.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                            Nenhum registro encontrado com os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        previaFiltrada.map((item) => {
                          const podeSelecionar = item.status === 'correspondido'
                          return (
                            <TableRow
                              key={item.id}
                              className={`transition-colors ${
                                !podeSelecionar
                                  ? 'bg-slate-50/60 opacity-60'
                                  : item.selecionado
                                    ? item.temDivergenciaValorAtual
                                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                      : 'hover:bg-slate-50/80'
                                    : 'bg-slate-100/40 text-slate-400 hover:bg-slate-100/70'
                              }`}
                            >
                              {/* Checkbox de Seleção */}
                              <TableCell className="text-center">
                                {podeSelecionar ? (
                                  <Checkbox
                                    checked={item.selecionado}
                                    onCheckedChange={() => handleToggleLinha(item.id)}
                                    aria-label={`Selecionar ${item.clienteArquivo}`}
                                  />
                                ) : (
                                  <span className="text-xs text-slate-300 font-mono">—</span>
                                )}
                              </TableCell>

                              {/* Linha */}
                              <TableCell className="text-center text-xs text-slate-400 font-mono">
                                #{item.linhaOriginal}
                              </TableCell>

                              {/* CNPJ */}
                              <TableCell>
                                <div className="font-mono text-xs text-slate-800">
                                  {item.cnpjValido
                                    ? formatCNPJ(item.cnpjNormalizado)
                                    : item.cnpjOriginal || '—'}
                                </div>
                                {!item.cnpjValido && item.motivoInvalido && (
                                  <div className="text-[10px] text-rose-600 mt-0.5">
                                    {item.motivoInvalido}
                                  </div>
                                )}
                              </TableCell>

                              {/* Nome no Arquivo */}
                              <TableCell>
                                <div className="text-xs font-medium text-slate-800">
                                  {item.clienteArquivo || '—'}
                                </div>
                                {(item.emissora || item.faturaSetembro) && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {item.emissora ? `Emissora: ${item.emissora}` : ''}
                                    {item.emissora && item.faturaSetembro ? ' • ' : ''}
                                    {item.faturaSetembro ? `Fatura: ${item.faturaSetembro}` : ''}
                                  </div>
                                )}
                              </TableCell>

                              {/* Nome no Sistema */}
                              <TableCell>
                                {item.clienteNomeSistema ? (
                                  <div className="text-xs font-semibold text-slate-900">
                                    {item.clienteNomeSistema}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Não localizado
                                  </span>
                                )}
                              </TableCell>

                              {/* Mensalidade Atual no Sistema */}
                              <TableCell className="text-right">
                                {item.clienteIdSistema ? (
                                  <span className="text-xs font-semibold text-slate-700">
                                    {formatCurrency(item.mensalidadeAtualSistema)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </TableCell>

                              {/* Novo Valor no Arquivo */}
                              <TableCell className="text-right">
                                {item.novoValorArquivo !== null ? (
                                  <span className="text-xs font-bold text-emerald-700">
                                    {formatCurrency(item.novoValorArquivo)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">Não informado</span>
                                )}
                              </TableCell>

                              {/* Indicador de Divergência */}
                              <TableCell className="text-center">
                                {item.status === 'correspondido' ? (
                                  item.temDivergenciaValorAtual ? (
                                    <div className="inline-flex flex-col items-center">
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold flex items-center gap-1"
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        Divergente
                                      </Badge>
                                      <span className="text-[10px] text-slate-500 mt-0.5">
                                        Arq: {formatCurrency(item.valorAtualArquivo || 0)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Bate com sistema
                                    </span>
                                  )
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </TableCell>

                              {/* Status Geral */}
                              <TableCell className="text-center">
                                {item.status === 'correspondido' ? (
                                  <Badge
                                    variant="outline"
                                    className={
                                      item.selecionado
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 text-xs'
                                    }
                                  >
                                    {item.selecionado ? 'Pronto para gravar' : 'Desmarcado'}
                                  </Badge>
                                ) : item.status === 'sem_correspondencia' ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-slate-100 text-slate-600 border-slate-300 text-[11px]"
                                  >
                                    Sem correspondência
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-rose-50 text-rose-700 border-rose-200 text-[11px]"
                                  >
                                    CNPJ Inválido
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Barra Inferior com Totais Financeiros */}
                <div className="bg-slate-100 p-3 px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs text-slate-700">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-500 block">Clientes Marcados:</span>
                      <strong className="text-slate-900 text-sm">
                        {resumo.totalSelecionados} de {resumo.totalCorrespondidos}
                      </strong>
                    </div>
                    <div className="border-l border-slate-300 pl-4">
                      <span className="text-slate-500 block">Soma Atual no Sistema:</span>
                      <strong className="text-slate-800 text-sm">
                        {formatCurrency(resumo.somaAtualSistemaSelecionados)}
                      </strong>
                    </div>
                    <div className="border-l border-slate-300 pl-4">
                      <span className="text-slate-500 block">Nova Soma Total:</span>
                      <strong className="text-emerald-700 text-sm">
                        {formatCurrency(resumo.somaNovoArquivoSelecionados)}
                      </strong>
                    </div>
                    <div className="border-l border-slate-300 pl-4">
                      <span className="text-slate-500 block">Variação da Carteira:</span>
                      <strong
                        className={`text-sm flex items-center gap-1 ${
                          resumo.somaNovoArquivoSelecionados >= resumo.somaAtualSistemaSelecionados
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {resumo.somaNovoArquivoSelecionados >=
                        resumo.somaAtualSistemaSelecionados ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {formatCurrency(
                          resumo.somaNovoArquivoSelecionados - resumo.somaAtualSistemaSelecionados,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="border-slate-300 hover:bg-slate-200"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Trocar Arquivo
                    </Button>
                    <Button
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={resumo.totalSelecionados === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aplicar Atualização ({resumo.totalSelecionados})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2.5: PROCESSANDO */}
            {etapa === 'processando' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Atualizando mensalidades no banco...
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Gravando trilha de auditoria e alterando exclusivamente o valor da mensalidade
                    dos clientes selecionados. Não feche esta janela.
                  </p>

                  <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-200"
                      style={{
                        width: `${
                          progresso.total > 0
                            ? Math.round((progresso.current / progresso.total) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {progresso.current} de {progresso.total} registros processados (
                    {progresso.total > 0
                      ? Math.round((progresso.current / progresso.total) * 100)
                      : 0}
                    %)
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: RELATÓRIO FINAL */}
            {etapa === 'relatorio' && resultado && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Cabeçalho do Relatório */}
                <div className="bg-emerald-50 border-b border-emerald-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-950">
                        Processamento Concluído com Sucesso!
                      </h4>
                      <p className="text-xs text-emerald-800">
                        Total de {resultado.totalSucesso} clientes atualizados com trilha de
                        auditoria gravada.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleExportExcel}
                      disabled={isExportingExcel}
                      className="bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 shadow-sm"
                    >
                      {isExportingExcel ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2 text-emerald-700" />
                      )}
                      Exportar Relatório Excel
                    </Button>
                    <Button
                      onClick={() => handleOpenChangeInternal(false)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      Concluir e Fechar
                    </Button>
                  </div>
                </div>

                {/* Tabela de Resultados */}
                <div className="flex-1 overflow-auto bg-white">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-16 text-center">Linha</TableHead>
                        <TableHead className="w-40">CNPJ</TableHead>
                        <TableHead className="min-w-[220px]">Cliente / Razão Social</TableHead>
                        <TableHead className="w-32 text-right">Valor Anterior</TableHead>
                        <TableHead className="w-32 text-right">Novo Valor</TableHead>
                        <TableHead className="w-32 text-right">Diferença</TableHead>
                        <TableHead className="w-40 text-center">Status</TableHead>
                        <TableHead className="min-w-[200px]">Mensagem / Detalhe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.itens.map((item, idx) => {
                        const diff = item.valorNovo - item.valorAnterior
                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-center text-xs text-slate-400 font-mono">
                              #{item.linhaOriginal}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-700">
                              {item.cnpj ? formatCNPJ(item.cnpj) : '—'}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-slate-900">
                              {item.clienteNome}
                            </TableCell>
                            <TableCell className="text-right text-xs text-slate-600">
                              {formatCurrency(item.valorAnterior)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-slate-900">
                              {formatCurrency(item.valorNovo)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold">
                              <span
                                className={
                                  diff > 0
                                    ? 'text-emerald-700'
                                    : diff < 0
                                      ? 'text-rose-700'
                                      : 'text-slate-500'
                                }
                              >
                                {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.status === 'sucesso' && (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                                  Atualizado
                                </Badge>
                              )}
                              {item.status === 'sem_correspondencia' && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-800 border-amber-200"
                                >
                                  Não Localizado
                                </Badge>
                              )}
                              {item.status === 'cnpj_invalido' && (
                                <Badge
                                  variant="outline"
                                  className="bg-rose-50 text-rose-800 border-rose-200"
                                >
                                  CNPJ Inválido
                                </Badge>
                              )}
                              {item.status === 'ignorado_desmarcado' && (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                  Desmarcado
                                </Badge>
                              )}
                              {item.status === 'erro' && <Badge variant="destructive">Falha</Badge>}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {item.mensagem || '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO EXPLÍCITA ANTES DE GRAVAR NO BANCO */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Confirmar Atualização em Lote?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 space-y-2 pt-2">
              <p>
                Você está prestes a atualizar o valor da mensalidade de{' '}
                <strong className="text-slate-900 font-bold">
                  {resumo?.totalSelecionados} clientes
                </strong>{' '}
                correspondidos no sistema.
              </p>
              <div className="bg-slate-50 p-3 rounded border text-xs text-slate-700 space-y-1">
                <div>
                  • Nova soma das mensalidades:{' '}
                  <strong>{formatCurrency(resumo?.somaNovoArquivoSelecionados || 0)}</strong>
                </div>
                <div>
                  • Trilha de auditoria será gravada em{' '}
                  <code className="font-mono">auditoria_mensalidades</code> e no histórico do
                  cliente.
                </div>
                <div>• Nenhum plano, módulo ou dado cadastral será alterado.</div>
              </div>
              <p className="text-xs text-amber-700 pt-1">
                Deseja prosseguir com a gravação definitiva?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar Prévia</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecutarAtualizacao}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Sim, Aplicar Atualização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
