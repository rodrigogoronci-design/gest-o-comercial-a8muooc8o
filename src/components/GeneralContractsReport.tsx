import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getRelatorioGeralContratos,
  type ContratoRelatorioGeral,
} from '@/services/relatorio-clientes'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import { parseModulosToList } from '@/lib/modules-parser'
import { MODULES } from '@/constants/contracts'
import logoUrl from '@/assets/logomarca-service-ea011.png'

function escapeCSVField(value: string | null | undefined): string {
  const safeValue = value ?? ''
  return `"${safeValue.replace(/"/g, '""')}"`
}

function normalizeModuleName(name: string): string {
  return name.trim().toLowerCase()
}

function formatDateBR(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return dateString
  return d.toLocaleDateString('pt-BR')
}

function downloadCSV(rows: ContratoRelatorioGeral[]) {
  const headers = [
    'Cliente',
    'CNPJ',
    'Tipo de Contrato / Operação',
    'Data de Solicitação',
    'Plano',
    'Mensalidade (R$)',
    'Módulos Contratados',
    'Status Contrato',
    'Status Cliente',
  ]
  const csvLines = [headers.map(escapeCSVField).join(';')]

  for (const row of rows) {
    const modulos = parseModulosToList(row.modulos)
    csvLines.push(
      [
        row.cliente_nome,
        row.cliente_cnpj ? formatCNPJ(row.cliente_cnpj) : '',
        row.tipo ?? '-',
        formatDateBR(row.data_solicitacao),
        row.plano ?? '-',
        row.valor_total != null ? formatCurrency(row.valor_total) : '',
        modulos.join(', '),
        row.status ?? '',
        row.cliente_status ?? '',
      ]
        .map(escapeCSVField)
        .join(';'),
    )
  }

  const csvContent = '\uFEFF' + csvLines.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const today = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `relatorio_geral_contratos_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function GeneralContractsReport() {
  const [contratos, setContratos] = useState<ContratoRelatorioGeral[]>([])
  const [loading, setLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null)

  // Filtros locais após gerar
  const [searchQuery, setSearchQuery] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [modulePresence, setModulePresence] = useState<'with' | 'without'>('with')

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await getRelatorioGeralContratos()
      setContratos(data)
      setHasGenerated(true)
      setLastGeneratedAt(new Date())
      toast.success(`${data.length} contrato(s) carregado(s) com dados frescos do banco.`)
    } catch (error: any) {
      toast.error('Erro ao buscar dados do relatório geral: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // Descobrir catálogo completo + quaisquer módulos gravados nos contratos
  const allModuleOptions = useMemo(() => {
    const map = new Map<string, string>()

    for (const mod of MODULES) {
      map.set(normalizeModuleName(mod.name), mod.name)
    }
    map.set('bi web', 'BI WEB')

    for (const contrato of contratos) {
      const list = parseModulosToList(contrato.modulos)
      for (const m of list) {
        const norm = normalizeModuleName(m)
        if (!map.has(norm)) {
          map.set(norm, m.trim())
        }
      }
    }

    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [contratos])

  // Tipos de contratos únicos para o filtro
  const uniqueTipos = useMemo(() => {
    const set = new Set<string>()
    for (const c of contratos) {
      if (c.tipo) set.add(c.tipo)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [contratos])

  // Filtragem dos contratos
  const filteredContratos = useMemo(() => {
    return contratos.filter((contrato) => {
      // 1. Busca textual (cliente, cnpj, plano)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchCliente = contrato.cliente_nome?.toLowerCase().includes(q)
        const matchCnpj =
          contrato.cliente_cnpj?.toLowerCase().includes(q) ||
          contrato.cliente_cnpj?.replace(/\D/g, '').includes(q)
        const matchPlano = contrato.plano?.toLowerCase().includes(q)
        if (!matchCliente && !matchCnpj && !matchPlano) return false
      }

      // 2. Filtro de tipo
      if (tipoFilter !== 'all' && contrato.tipo !== tipoFilter) {
        return false
      }

      // 3. Filtro de módulo
      if (selectedModule !== 'all') {
        const modulos = parseModulosToList(contrato.modulos)
        const hasMod = modulos.some((m) => normalizeModuleName(m) === selectedModule)
        if (modulePresence === 'with' && !hasMod) return false
        if (modulePresence === 'without' && hasMod) return false
      }

      return true
    })
  }, [contratos, searchQuery, tipoFilter, selectedModule, modulePresence])

  // Estatísticas de módulo selecionado
  const moduleStats = useMemo(() => {
    if (selectedModule === 'all') return null
    let countWith = 0
    let countWithout = 0
    for (const c of contratos) {
      const modulos = parseModulosToList(c.modulos)
      if (modulos.some((m) => normalizeModuleName(m) === selectedModule)) {
        countWith++
      } else {
        countWithout++
      }
    }
    const currentOption = allModuleOptions.find((opt) => opt.key === selectedModule)
    return {
      name: currentOption?.label || selectedModule,
      countWith,
      countWithout,
    }
  }, [contratos, selectedModule, allModuleOptions])

  const handleExport = () => {
    if (filteredContratos.length === 0) {
      toast.warning('Não há dados para exportar.')
      return
    }
    downloadCSV(filteredContratos)
    toast.success('Relatório geral de contratos exportado com sucesso!')
  }

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="hidden print:flex items-center gap-8 border-b-2 border-slate-200 pb-3 mb-2">
        <img src={logoUrl} alt="Service Logic" className="h-12 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-[#1b4382]">Relatório Geral de Contratos</h1>
          <p className="text-[10pt] text-slate-600">
            Documento gerado em{' '}
            {lastGeneratedAt
              ? formatDate(lastGeneratedAt.toISOString())
              : formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      <Card className="shadow-sm print-card print:shadow-none print:border-none">
        <CardHeader className="no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#1b4382]" />
                Relatório Geral de Contratos
              </CardTitle>
              <CardDescription className="mt-1">
                Acompanhamento completo de contratos, aditivos, reativações e propostas com
                separação e filtros por módulos adicionais e valores vigentes.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasGenerated ? (
                <>
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-[#1b4382] hover:bg-[#1b4382]/90 text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar Dados
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    disabled={contratos.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={loading || filteredContratos.length === 0}
                    variant="outline"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-[#1b4382] hover:bg-[#1b4382]/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando Dados...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Gerar Relatório Geral
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {/* Estado inicial vazio antes de gerar */}
          {!hasGenerated && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center no-print border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <div className="rounded-full bg-blue-50 p-4 mb-4 text-[#1b4382]">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                Gere o relatório para ver os dados atuais
              </p>
              <p className="text-sm text-slate-500 max-w-md mt-1 mb-5">
                Os dados de contratos, aditivos e mensalidades não são pré-carregados para garantir
                que você visualize sempre o estado mais recente do banco de dados.
              </p>
              <Button
                onClick={handleGenerate}
                className="bg-[#1b4382] hover:bg-[#1b4382]/90 text-white"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Gerar Relatório Geral
              </Button>
            </div>
          )}

          {/* Loader durante a busca */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 no-print">
              <Loader2 className="h-8 w-8 animate-spin text-[#1b4382] mb-3" />
              <span className="text-sm font-medium text-slate-600">
                Buscando contratos e alterações atualizadas no banco...
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Carregando dados frescos do Supabase sem cache prévio.
              </span>
            </div>
          )}

          {/* Área de conteúdo após gerar */}
          {hasGenerated && !loading && (
            <div className="space-y-4">
              {/* Barra de Filtros (Pesquisa, Tipo, Módulo) */}
              <div className="no-print bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <Filter className="h-3.5 w-3.5 text-[#1b4382]" />
                  Filtros de Contratos e Módulos
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Busca textual */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Search className="h-3 w-3 text-slate-400" /> Buscar por cliente ou CNPJ
                    </label>
                    <Input
                      placeholder="Ex: Transportes, 00.000..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 bg-white text-sm"
                    />
                  </div>

                  {/* Filtro Tipo de Contrato */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Tipo de Contrato</label>
                    <Select value={tipoFilter} onValueChange={setTipoFilter}>
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {uniqueTipos.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro Módulo */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-[#1b4382]" /> Módulo Adicional
                    </label>
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Selecione um módulo..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="all">Todos os módulos</SelectItem>
                        {allModuleOptions.map((mod) => (
                          <SelectItem key={mod.key} value={mod.key}>
                            {mod.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Condição do Módulo */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Presença do Módulo</label>
                    <Select
                      value={modulePresence}
                      onValueChange={(val: any) => setModulePresence(val)}
                      disabled={selectedModule === 'all'}
                    >
                      <SelectTrigger className="h-9 bg-white text-sm disabled:opacity-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="with">Contratos que POSSUEM o módulo</SelectItem>
                        <SelectItem value="without">Contratos que NÃO POSSUEM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Resumo do Módulo Filtrado */}
                {moduleStats && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">
                        Módulo analisado:{' '}
                        <strong className="text-slate-800">{moduleStats.name}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        {moduleStats.countWith} contrato(s) possuem
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        <XCircle className="h-3 w-3" />
                        {moduleStats.countWithout} contrato(s) não possuem
                      </span>
                    </div>

                    {(searchQuery || tipoFilter !== 'all' || selectedModule !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-slate-500 hover:text-slate-900"
                        onClick={() => {
                          setSearchQuery('')
                          setTipoFilter('all')
                          setSelectedModule('all')
                          setModulePresence('with')
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Tabela de Resultados */}
              {contratos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center no-print">
                  <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-base font-medium text-slate-600">
                    Nenhum contrato cadastrado no banco
                  </p>
                </div>
              ) : filteredContratos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center no-print border border-slate-200 rounded-lg bg-slate-50/50">
                  <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Nenhum contrato corresponde aos filtros aplicados
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-3">
                    Tente ajustar o termo de busca ou selecionar outro tipo/módulo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setTipoFilter('all')
                      setSelectedModule('all')
                      setModulePresence('with')
                    }}
                  >
                    Resetar Filtros
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 overflow-hidden print:border-slate-300 print:rounded-none">
                  <div className="overflow-x-auto print:overflow-visible">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50 print:bg-slate-100">
                          <TableHead className="min-w-[180px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Cliente / Razão Social
                          </TableHead>
                          <TableHead className="min-w-[140px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            CNPJ
                          </TableHead>
                          <TableHead className="min-w-[150px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Tipo de Operação
                          </TableHead>
                          <TableHead className="min-w-[110px] text-center font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Data
                          </TableHead>
                          <TableHead className="min-w-[120px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Plano
                          </TableHead>
                          <TableHead className="min-w-[110px] text-right font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Mensalidade
                          </TableHead>
                          <TableHead className="min-w-[220px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Módulos Adicionais
                          </TableHead>
                          <TableHead className="min-w-[100px] text-center font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContratos.map((contrato) => {
                          const modulos = parseModulosToList(contrato.modulos)
                          const isInactive =
                            contrato.cliente_status === 'Inativo' ||
                            contrato.cliente_status === 'Cancelado' ||
                            contrato.cliente_status?.toLowerCase() === 'inativo' ||
                            contrato.cliente_status?.toLowerCase() === 'cancelado'

                          return (
                            <TableRow
                              key={contrato.id}
                              className="hover:bg-slate-50/60 transition-colors print:hover:bg-transparent print:break-inside-avoid"
                            >
                              <TableCell className="font-medium text-slate-800 print:text-[8pt] print:py-1">
                                {contrato.cliente_nome}
                              </TableCell>
                              <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
                                {contrato.cliente_cnpj ? formatCNPJ(contrato.cliente_cnpj) : '—'}
                              </TableCell>
                              <TableCell className="text-slate-700 font-medium print:text-[8pt] print:py-1">
                                <Badge
                                  variant="outline"
                                  className="bg-slate-100 border-slate-300 text-slate-700 text-[10px] py-0 px-2 font-medium"
                                >
                                  {contrato.tipo || 'Contrato'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-slate-600 print:text-[8pt] print:py-1">
                                {formatDateBR(contrato.data_solicitacao)}
                              </TableCell>
                              <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
                                {contrato.plano ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 border-blue-200 text-blue-700 text-[10px] py-0 px-1.5 font-medium print:border-slate-300"
                                  >
                                    {contrato.plano}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-slate-800 print:text-[8pt] print:py-1">
                                {contrato.valor_total != null && contrato.valor_total > 0
                                  ? formatCurrency(contrato.valor_total)
                                  : '—'}
                              </TableCell>
                              <TableCell className="print:text-[8pt] print:py-1">
                                {modulos.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {modulos.map((modulo, idx) => {
                                      const isHighlighted =
                                        selectedModule !== 'all' &&
                                        normalizeModuleName(modulo) === selectedModule
                                      return (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className={`text-[10px] py-0 px-1.5 font-medium print:border-slate-300 ${
                                            isHighlighted
                                              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                              : 'bg-white border-slate-200 text-slate-600'
                                          }`}
                                        >
                                          {modulo}
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Nenhum módulo específico
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center print:text-[8pt] print:py-1">
                                <Badge
                                  variant={isInactive ? 'destructive' : 'secondary'}
                                  className={
                                    isInactive
                                      ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                      : 'bg-green-100 text-green-700 hover:bg-green-100'
                                  }
                                >
                                  {contrato.status || contrato.cliente_status || 'Ativo'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 no-print gap-2">
                    <span className="text-sm text-slate-500">
                      Exibindo{' '}
                      <strong className="text-slate-700">{filteredContratos.length}</strong> de{' '}
                      <strong className="text-slate-700">{contratos.length}</strong> contrato(s)
                    </span>
                    {lastGeneratedAt && (
                      <span className="text-xs text-slate-400">
                        Última busca fresca: {lastGeneratedAt.toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="hidden print:flex items-center justify-end px-4 py-2 border-t border-slate-300 text-[8pt] text-slate-600">
                    Total de {filteredContratos.length} contrato(s)
                  </div>
                </div>
              )}

              {/* Informação sobre os dados em tempo real */}
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 no-print">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                <span>
                  O relatório geral busca os contratos registrados e aditivos diretamente do banco.
                  A mensalidade corresponde ao valor atualizado de cada registro, permitindo
                  acompanhar o histórico completo por cliente.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
