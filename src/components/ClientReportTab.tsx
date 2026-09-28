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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  Users,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  Printer,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  FileCheck,
  FileX,
  Layers,
  ChevronDown,
  X,
  FileDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClientesRelatorio,
  normalizePlanName,
  type ClienteRelatorio,
} from '@/services/relatorio-clientes'
import {
  exportClientesToExcel,
  formatAssinaturaDate,
  normalizeExactModuleName,
  matchesExactModule,
  ORDERED_DEFAULT_MODULES,
} from '@/services/relatorio-clientes-excel'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import { parseModulosToList } from '@/lib/modules-parser'
import { MODULES } from '@/constants/contracts'
import logoUrl from '@/assets/logomarca-service-ea011.png'

function escapeCSVField(value: string | null | undefined): string {
  const safeValue = value ?? ''
  return `"${safeValue.replace(/"/g, '""')}"`
}

function downloadCSV(rows: ClienteRelatorio[]) {
  const headers = [
    'Nome / Razão Social',
    'CNPJ',
    'Duplicidade CNPJ',
    'Data de assinatura do contrato',
    'Mensalidade',
    'Dia de Vencimento',
    'Código do Plano',
    'Plano Contratado',
    'Módulos',
    'Endereço',
    'Status',
  ]
  const csvLines = [headers.map(escapeCSVField).join(';')]

  for (const row of rows) {
    const modulos = parseModulosToList(row.modulos)
    const dupText = row.cnpj_duplicado_count
      ? `CNPJ duplicado (${row.cnpj_duplicado_count} registros)`
      : 'Não duplicado'
    const planoExibido =
      row.plano_descricao && row.plano_descricao.trim()
        ? row.plano_descricao.trim()
        : 'Não informado'
    const dataAssinaturaFormatada = formatAssinaturaDate(row.data_assinatura)

    csvLines.push(
      [
        row.nome,
        row.cnpj ? formatCNPJ(row.cnpj) : '',
        dupText,
        dataAssinaturaFormatada,
        row.valor_total != null ? formatCurrency(row.valor_total) : '',
        row.vencimento_mensal != null ? String(row.vencimento_mensal) : '',
        row.plano_codigo ?? '-',
        planoExibido,
        modulos.join(', '),
        row.endereco ?? '',
        row.status ?? '',
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
  link.download = `relatorio_clientes_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ClientReportTab() {
  const [clientes, setClientes] = useState<ClienteRelatorio[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null)

  // Filtros locais (após gerar)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all')
  const [planoFilter, setPlanoFilter] = useState<string>('all')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [moduleMatchMode, setModuleMatchMode] = useState<'and' | 'or'>('and')
  const [modulePresence, setModulePresence] = useState<'with' | 'without'>('with')
  const [situacaoAssinatura, setSituacaoAssinatura] = useState<'all' | 'com_data' | 'sem_data'>(
    'all',
  )
  const [moduleSearchFilter, setModuleSearchFilter] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await getClientesRelatorio()
      setClientes(data)
      setHasGenerated(true)
      setLastGeneratedAt(new Date())
      toast.success(`${data.length} cliente(s) carregado(s) com dados frescos do banco.`)
    } catch (error: any) {
      toast.error('Erro ao carregar relatório de clientes: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // Descobrir catálogo completo ordenado com a lista padrão prioritária do usuário
  // + módulos adicionais cadastrados no catálogo e banco
  const allModuleOptions = useMemo(() => {
    const orderedList: { key: string; label: string }[] = []
    const existingNorms = new Set<string>()

    // 1. Inserir a lista de destaque exigida pelo usuário
    for (const name of ORDERED_DEFAULT_MODULES) {
      const norm = normalizeExactModuleName(name)
      if (!existingNorms.has(norm)) {
        orderedList.push({ key: norm, label: name })
        existingNorms.add(norm)
      }
    }

    // 2. Módulos do catálogo oficial que não estejam mapeados
    for (const mod of MODULES) {
      const norm = normalizeExactModuleName(mod.name)
      if (!existingNorms.has(norm)) {
        if (norm.startsWith('frota') && existingNorms.has('frota')) continue
        if ((norm === 'bi web' || norm === 'power bi') && existingNorms.has('bi')) continue
        if (norm.startsWith('torre de controle') && existingNorms.has('torre de controle')) continue
        orderedList.push({ key: norm, label: mod.name })
        existingNorms.add(norm)
      }
    }

    // 3. Módulos encontrados no banco
    for (const cliente of clientes) {
      const list = parseModulosToList(cliente.modulos)
      for (const m of list) {
        const norm = normalizeExactModuleName(m)
        if (norm.startsWith('frota') && existingNorms.has('frota')) continue
        if ((norm === 'bi web' || norm === 'power bi' || norm === 'bi') && existingNorms.has('bi'))
          continue
        if (norm.startsWith('torre de controle') && existingNorms.has('torre de controle')) continue
        if (!existingNorms.has(norm)) {
          orderedList.push({ key: norm, label: m.trim() })
          existingNorms.add(norm)
        }
      }
    }

    return orderedList
  }, [clientes])

  // Opções de planos agrupadas por valor normalizado (TMS 100 ≡ TMS-100)
  const allPlanoOptions = useMemo(() => {
    const groupMap = new Map<string, { key: string; label: string; count: number }>()

    for (const c of clientes) {
      const rawPlano =
        c.plano_descricao && c.plano_descricao.trim() ? c.plano_descricao.trim() : 'Não informado'
      const normKey = rawPlano === 'Não informado' ? 'NAO_INFORMADO' : normalizePlanName(rawPlano)

      if (!groupMap.has(normKey)) {
        groupMap.set(normKey, {
          key: normKey,
          label: rawPlano,
          count: 1,
        })
      } else {
        const item = groupMap.get(normKey)!
        item.count++
      }
    }

    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.key === 'NAO_INFORMADO') return 1
      if (b.key === 'NAO_INFORMADO') return -1
      return a.label.localeCompare(b.label, undefined, { numeric: true })
    })
  }, [clientes])

  // Filtragem dos clientes em tela
  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      // 1. Busca por nome, CNPJ ou plano
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNome = cliente.nome?.toLowerCase().includes(q)
        const matchCnpj =
          cliente.cnpj?.toLowerCase().includes(q) || cliente.cnpj?.replace(/\D/g, '').includes(q)
        const matchPlano = cliente.plano_descricao?.toLowerCase().includes(q)
        if (!matchNome && !matchCnpj && !matchPlano) return false
      }

      // 2. Filtro de status
      if (statusFilter !== 'all') {
        const isInactive =
          cliente.status === 'Inativo' ||
          cliente.status === 'Cancelado' ||
          cliente.status?.toLowerCase() === 'inativo' ||
          cliente.status?.toLowerCase() === 'cancelado'
        if (statusFilter === 'ativo' && isInactive) return false
        if (statusFilter === 'inativo' && !isInactive) return false
      }

      // 3. Filtro por plano
      if (planoFilter !== 'all') {
        const rawPlano =
          cliente.plano_descricao && cliente.plano_descricao.trim()
            ? cliente.plano_descricao.trim()
            : 'Não informado'
        const normKey = rawPlano === 'Não informado' ? 'NAO_INFORMADO' : normalizePlanName(rawPlano)
        if (normKey !== planoFilter) return false
      }

      // 4. Filtro por Situação da Data de Assinatura
      if (situacaoAssinatura !== 'all') {
        const hasData = Boolean(cliente.data_assinatura && cliente.data_assinatura.trim())
        if (situacaoAssinatura === 'com_data' && !hasData) return false
        if (situacaoAssinatura === 'sem_data' && hasData) return false
      }

      // 5. Filtro Módulo Contratado (multi-seleção com comparação exata)
      if (selectedModules.length > 0) {
        const modulosList = parseModulosToList(cliente.modulos)

        if (modulePresence === 'with') {
          if (moduleMatchMode === 'and') {
            // Cliente DEVE possuir TODOS os módulos selecionados
            const hasAll = selectedModules.every((target) =>
              modulosList.some((m) => matchesExactModule(m, target)),
            )
            if (!hasAll) return false
          } else {
            // Cliente DEVE possuir QUALQUER um dos módulos selecionados (OU)
            const hasAny = selectedModules.some((target) =>
              modulosList.some((m) => matchesExactModule(m, target)),
            )
            if (!hasAny) return false
          }
        } else {
          // Clientes que NÃO POSSUEM o(s) módulo(s) selecionados
          if (moduleMatchMode === 'and') {
            // Não possui todos
            const hasAll = selectedModules.every((target) =>
              modulosList.some((m) => matchesExactModule(m, target)),
            )
            if (hasAll) return false
          } else {
            // Não possui nenhum dos selecionados
            const hasAny = selectedModules.some((target) =>
              modulosList.some((m) => matchesExactModule(m, target)),
            )
            if (hasAny) return false
          }
        }
      }

      return true
    })
  }, [
    clientes,
    searchQuery,
    statusFilter,
    planoFilter,
    situacaoAssinatura,
    selectedModules,
    moduleMatchMode,
    modulePresence,
  ])

  // Contadores de resumo no topo baseados na lista filtrada (Requisito 6)
  const summaryCounts = useMemo(() => {
    let comAssinatura = 0
    let semAssinatura = 0

    for (const c of filteredClientes) {
      if (c.data_assinatura && c.data_assinatura.trim()) {
        comAssinatura++
      } else {
        semAssinatura++
      }
    }

    return {
      total: filteredClientes.length,
      comAssinatura,
      semAssinatura,
    }
  }, [filteredClientes])

  // Módulos filtrados pela caixa de busca dentro do popover
  const visibleModuleOptions = useMemo(() => {
    if (!moduleSearchFilter.trim()) return allModuleOptions
    const q = moduleSearchFilter.toLowerCase().trim()
    return allModuleOptions.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [allModuleOptions, moduleSearchFilter])

  const toggleModuleSelection = (moduleKey: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleKey) ? prev.filter((k) => k !== moduleKey) : [...prev, moduleKey],
    )
  }

  const handleExportCSV = () => {
    if (filteredClientes.length === 0) {
      toast.warning('Não há dados para exportar.')
      return
    }
    downloadCSV(filteredClientes)
    toast.success('Relatório de clientes exportado em CSV!')
  }

  const handleExportExcel = async () => {
    if (filteredClientes.length === 0) {
      toast.warning('Não há dados para exportar.')
      return
    }
    setExportingExcel(true)
    try {
      await exportClientesToExcel(filteredClientes)
      toast.success('Planilha Excel (.xlsx) gerada com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao gerar Excel: ' + (error.message || ''))
    } finally {
      setExportingExcel(false)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPlanoFilter('all')
    setSelectedModules([])
    setModuleMatchMode('and')
    setModulePresence('with')
    setSituacaoAssinatura('all')
  }

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'all' ||
    planoFilter !== 'all' ||
    selectedModules.length > 0 ||
    situacaoAssinatura !== 'all'

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Cabeçalho de Impressão */}
      <div className="hidden print:flex items-center gap-8 border-b-2 border-slate-200 pb-3 mb-2">
        <img src={logoUrl} alt="Service Logic" className="h-12 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-[#1b4382]">Relatório de Clientes</h1>
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
                <Building2 className="h-5 w-5 text-[#1b4382]" />
                Relatório de Clientes
              </CardTitle>
              <CardDescription className="mt-1">
                Visão consolidada dos clientes cadastrados com dados em tempo real, data de
                assinatura do contrato, módulos contratados individuais e opções de exportação em
                Excel e CSV.
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
                    disabled={clientes.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    disabled={loading || filteredClientes.length === 0}
                    variant="outline"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button
                    onClick={handleExportExcel}
                    disabled={loading || exportingExcel || filteredClientes.length === 0}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    {exportingExcel ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                    )}
                    Exportar Excel (.xlsx)
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
                      <Building2 className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {/* Se ainda não gerou, exibe estado inicial informativo */}
          {!hasGenerated && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center no-print border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <div className="rounded-full bg-blue-50 p-4 mb-4 text-[#1b4382]">
                <Building2 className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                Gere o relatório para ver os dados atuais
              </p>
              <p className="text-sm text-slate-500 max-w-md mt-1 mb-5">
                Clique no botão abaixo para buscar os dados frescos diretamente do banco de dados,
                refletindo datas de assinatura, status, mensalidades e todos os módulos.
              </p>
              <Button
                onClick={handleGenerate}
                className="bg-[#1b4382] hover:bg-[#1b4382]/90 text-white"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Gerar Relatório de Clientes
              </Button>
            </div>
          )}

          {/* Loader durante a busca */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 no-print">
              <Loader2 className="h-8 w-8 animate-spin text-[#1b4382] mb-3" />
              <span className="text-sm font-medium text-slate-600">
                Buscando clientes e módulos atualizados no banco...
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Isso garante que os dados em tela sejam 100% atuais.
              </span>
            </div>
          )}

          {/* Área de conteúdo após gerar */}
          {hasGenerated && !loading && (
            <div className="space-y-4">
              {/* Resumo no topo: 3 cards exigidos pelo usuário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-center print:bg-white print:border-slate-300">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-600" />
                    Total de Clientes
                  </span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">
                    {summaryCounts.total}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {clientes.length} no banco no total
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 text-center print:bg-white print:border-slate-300">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 flex items-center justify-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-emerald-700" />
                    Com Data de Assinatura Preenchida
                  </span>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">
                    {summaryCounts.comAssinatura}
                  </div>
                  <span className="text-[11px] text-emerald-600">
                    Contratos com data informada no cadastro
                  </span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 text-center print:bg-white print:border-slate-300">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 flex items-center justify-center gap-1.5">
                    <FileX className="h-3.5 w-3.5 text-amber-700" />
                    Sem Data de Assinatura
                  </span>
                  <div className="text-2xl font-bold text-amber-800 mt-1">
                    {summaryCounts.semAssinatura}
                  </div>
                  <span className="text-[11px] text-amber-700">
                    Exibidos como &quot;Não informada&quot;
                  </span>
                </div>
              </div>

              {/* Barra de Filtros Completos */}
              <div className="no-print bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <Filter className="h-3.5 w-3.5 text-[#1b4382]" />
                    Filtros de Clientes, Contratos e Módulos
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-slate-500 hover:text-slate-900"
                      onClick={handleResetFilters}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  {/* Busca textual */}
                  <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Search className="h-3 w-3 text-slate-400" /> Buscar por nome, CNPJ ou plano
                    </label>
                    <Input
                      placeholder="Ex: Transportes, 00.000..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 bg-white text-sm"
                    />
                  </div>

                  {/* Filtro Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Status do Cliente</label>
                    <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="ativo">Apenas Ativos</SelectItem>
                        <SelectItem value="inativo">Apenas Inativos / Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Plano */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Plano Contratado</label>
                    <Select value={planoFilter} onValueChange={setPlanoFilter}>
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Todos os planos" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="all">Todos os planos</SelectItem>
                        {allPlanoOptions.map((opt) => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {opt.label} ({opt.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro Situação da Data de Assinatura */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Data de Assinatura</label>
                    <Select
                      value={situacaoAssinatura}
                      onValueChange={(val: any) => setSituacaoAssinatura(val)}
                    >
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Todas as situações" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as situações</SelectItem>
                        <SelectItem value="com_data">Com data preenchida</SelectItem>
                        <SelectItem value="sem_data">Sem data preenchida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro Módulo Contratado (Multi-seleção) */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-[#1b4382]" /> Módulo contratado
                      </span>
                      {selectedModules.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedModules([])}
                          className="text-[10px] text-blue-600 hover:underline"
                        >
                          Limpar ({selectedModules.length})
                        </button>
                      )}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="h-9 w-full justify-between bg-white text-sm font-normal px-2.5"
                        >
                          <span className="truncate">
                            {selectedModules.length === 0
                              ? 'Todos os módulos'
                              : selectedModules.length === 1
                                ? allModuleOptions.find((m) => m.key === selectedModules[0])
                                    ?.label || selectedModules[0]
                                : `${selectedModules.length} módulos selecionados`}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2" align="start">
                        <div className="space-y-2">
                          <Input
                            placeholder="Pesquisar módulo..."
                            value={moduleSearchFilter}
                            onChange={(e) => setModuleSearchFilter(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                            {visibleModuleOptions.map((mod) => {
                              const isChecked = selectedModules.includes(mod.key)
                              return (
                                <label
                                  key={mod.key}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 cursor-pointer text-xs text-slate-700"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleModuleSelection(mod.key)}
                                  />
                                  <span className="flex-1 truncate">{mod.label}</span>
                                </label>
                              )
                            })}
                            {visibleModuleOptions.length === 0 && (
                              <p className="text-xs text-slate-400 text-center py-2">
                                Nenhum módulo encontrado
                              </p>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Controles adicionais do filtro de módulo quando selecionado */}
                {selectedModules.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs bg-white/70 p-2.5 rounded">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-600 font-medium">Condição:</span>
                      <div className="inline-flex rounded-md shadow-sm border border-slate-300 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setModulePresence('with')}
                          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                            modulePresence === 'with'
                              ? 'bg-[#1b4382] text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          POSSUEM
                        </button>
                        <button
                          type="button"
                          onClick={() => setModulePresence('without')}
                          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                            modulePresence === 'without'
                              ? 'bg-[#1b4382] text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          NÃO POSSUEM
                        </button>
                      </div>

                      {selectedModules.length > 1 && (
                        <div className="inline-flex rounded-md shadow-sm border border-slate-300 overflow-hidden ml-2">
                          <button
                            type="button"
                            onClick={() => setModuleMatchMode('and')}
                            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                              moduleMatchMode === 'and'
                                ? 'bg-[#f37021] text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            title="O cliente deve possuir TODOS os módulos selecionados"
                          >
                            Todos (E)
                          </button>
                          <button
                            type="button"
                            onClick={() => setModuleMatchMode('or')}
                            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                              moduleMatchMode === 'or'
                                ? 'bg-[#f37021] text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            title="O cliente deve possuir pelo menos UM dos módulos selecionados"
                          >
                            Qualquer (OU)
                          </button>
                        </div>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        {filteredClientes.length} cliente(s) atendem aos filtros
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-slate-400 text-[11px] mr-1">Selecionados:</span>
                      {selectedModules.map((modKey) => {
                        const opt = allModuleOptions.find((m) => m.key === modKey)
                        return (
                          <Badge
                            key={modKey}
                            variant="secondary"
                            className="bg-slate-200 text-slate-800 text-[10px] pl-2 pr-1 py-0 gap-1 font-normal"
                          >
                            <span>{opt?.label || modKey}</span>
                            <button
                              type="button"
                              onClick={() => toggleModuleSelection(modKey)}
                              className="hover:text-red-600 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabela de Resultados */}
              {clientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center no-print">
                  <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-base font-medium text-slate-600">
                    Nenhum cliente cadastrado no banco
                  </p>
                </div>
              ) : filteredClientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center no-print border border-slate-200 rounded-lg bg-slate-50/50">
                  <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Nenhum cliente corresponde aos filtros aplicados
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-3">
                    Tente ajustar o termo de busca ou selecionar outro módulo/situação.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Resetar Filtros
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 overflow-hidden print:border-slate-300 print:rounded-none">
                  {/* Container scrollável com cabeçalho sticky */}
                  <div className="overflow-x-auto max-h-[720px] print:max-h-none print:overflow-visible">
                    <Table className="relative w-full border-collapse">
                      <TableHeader className="sticky top-0 z-20 shadow-sm">
                        <TableRow className="bg-[#1b4382] hover:bg-[#1b4382] border-b-2 border-[#f37021] text-white">
                          <TableHead className="w-[220px] min-w-[200px] max-w-[240px] font-semibold text-white print:text-[8pt] print:py-1">
                            Nome / Razão Social
                          </TableHead>
                          <TableHead className="w-[140px] min-w-[130px] font-semibold text-white print:text-[8pt] print:py-1">
                            CNPJ
                          </TableHead>
                          <TableHead className="w-[150px] min-w-[140px] text-center font-semibold text-white print:text-[8pt] print:py-1">
                            Data de assinatura do contrato
                          </TableHead>
                          <TableHead className="w-[120px] min-w-[110px] text-right font-semibold text-white print:text-[8pt] print:py-1">
                            Mensalidade
                          </TableHead>
                          <TableHead className="w-[85px] min-w-[75px] text-center font-semibold text-white print:text-[8pt] print:py-1">
                            Vencimento
                          </TableHead>
                          <TableHead className="w-[90px] min-w-[80px] font-semibold text-white print:text-[8pt] print:py-1">
                            Código
                          </TableHead>
                          <TableHead className="w-[150px] min-w-[140px] font-semibold text-white print:text-[8pt] print:py-1">
                            Plano
                          </TableHead>
                          <TableHead className="w-[280px] min-w-[260px] max-w-[320px] font-semibold text-white print:text-[8pt] print:py-1">
                            Módulos Adicionais
                          </TableHead>
                          <TableHead className="w-[180px] min-w-[160px] max-w-[220px] font-semibold text-white print:hidden">
                            Endereço
                          </TableHead>
                          <TableHead className="w-[95px] min-w-[90px] text-center font-semibold text-white print:text-[8pt] print:py-1">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClientes.map((cliente, idx) => {
                          const modulos = parseModulosToList(cliente.modulos)
                          const isInactive =
                            cliente.status === 'Inativo' ||
                            cliente.status === 'Cancelado' ||
                            cliente.status?.toLowerCase() === 'inativo' ||
                            cliente.status?.toLowerCase() === 'cancelado'

                          const dataAssinaturaFormatada = formatAssinaturaDate(
                            cliente.data_assinatura,
                          )
                          const hasDataAssinatura = Boolean(
                            cliente.data_assinatura && cliente.data_assinatura.trim(),
                          )

                          // Cores alternadas em tons claros suaves
                          const rowBgClass =
                            idx % 2 === 0
                              ? 'bg-white hover:bg-blue-50/40'
                              : 'bg-slate-50/70 hover:bg-blue-50/50'

                          return (
                            <TableRow
                              key={cliente.id}
                              className={`${rowBgClass} transition-colors border-b border-slate-200/80 print:hover:bg-transparent print:break-inside-avoid`}
                            >
                              {/* Nome / Razão Social */}
                              <TableCell className="w-[220px] min-w-[200px] max-w-[240px] font-medium text-slate-800 break-words print:text-[8pt] print:py-1">
                                <div className="flex flex-col gap-0.5">
                                  <span className="leading-snug">{cliente.nome}</span>
                                  {cliente.cnpj_duplicado_count &&
                                    cliente.cnpj_duplicado_count > 1 && (
                                      <Badge
                                        variant="outline"
                                        className="w-fit bg-amber-50 text-amber-800 border-amber-300 text-[9px] py-0 px-1 font-medium mt-0.5"
                                        title={`Há ${cliente.cnpj_duplicado_count} cadastros com este mesmo CNPJ.`}
                                      >
                                        CNPJ duplicado ({cliente.cnpj_duplicado_count} registros)
                                      </Badge>
                                    )}
                                </div>
                              </TableCell>

                              {/* CNPJ */}
                              <TableCell className="w-[140px] min-w-[130px] text-slate-600 font-mono text-xs whitespace-nowrap print:text-[8pt] print:py-1">
                                {cliente.cnpj ? formatCNPJ(cliente.cnpj) : '—'}
                              </TableCell>

                              {/* Nova Coluna: Data de assinatura do contrato */}
                              <TableCell className="w-[150px] min-w-[140px] text-center print:text-[8pt] print:py-1">
                                {hasDataAssinatura ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-xs">
                                    {dataAssinaturaFormatada}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Não informada
                                  </span>
                                )}
                              </TableCell>

                              {/* Mensalidade formatada como moeda */}
                              <TableCell className="w-[120px] min-w-[110px] text-right font-semibold text-slate-900 whitespace-nowrap print:text-[8pt] print:py-1">
                                {cliente.valor_total != null && cliente.valor_total > 0
                                  ? formatCurrency(cliente.valor_total)
                                  : 'R$ 0,00'}
                              </TableCell>

                              {/* Dia de Vencimento */}
                              <TableCell className="w-[85px] min-w-[75px] text-center text-slate-600 text-xs print:text-[8pt] print:py-1">
                                {cliente.vencimento_mensal != null
                                  ? `${cliente.vencimento_mensal}º`
                                  : '—'}
                              </TableCell>

                              {/* Código do Plano */}
                              <TableCell className="w-[90px] min-w-[80px] text-slate-600 print:text-[8pt] print:py-1">
                                {cliente.plano_codigo ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 border-blue-200 text-blue-700 text-[10px] py-0 px-1.5 font-medium print:border-slate-300"
                                  >
                                    {cliente.plano_codigo}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">-</span>
                                )}
                              </TableCell>

                              {/* Plano Contratado */}
                              <TableCell className="w-[150px] min-w-[140px] text-slate-600 break-words print:text-[8pt] print:py-1">
                                {cliente.plano_descricao &&
                                cliente.plano_descricao !== 'Não informado' ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-xs leading-tight">
                                      {cliente.plano_descricao}
                                    </span>
                                    {cliente.plano_codigo && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {cliente.plano_codigo}
                                      </span>
                                    )}
                                  </div>
                                ) : cliente.plano_codigo ? (
                                  <Badge
                                    variant="outline"
                                    className="w-fit bg-blue-50 border-blue-200 text-blue-700 text-[10px] py-0 px-1.5 font-medium"
                                  >
                                    {cliente.plano_codigo}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Não informado
                                  </span>
                                )}
                              </TableCell>

                              {/* Módulos como Etiquetas Individuais */}
                              <TableCell className="w-[280px] min-w-[260px] max-w-[320px] print:text-[8pt] print:py-1">
                                {modulos.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                                    {modulos.map((modulo, mIdx) => {
                                      const isFilterTarget =
                                        selectedModules.length > 0 &&
                                        selectedModules.some((sm) => matchesExactModule(modulo, sm))
                                      return (
                                        <Badge
                                          key={mIdx}
                                          variant="outline"
                                          className={`text-[10px] py-0 px-1.5 font-medium tracking-tight print:border-slate-300 ${
                                            isFilterTarget
                                              ? 'bg-[#1b4382] text-white border-[#1b4382] shadow-sm font-semibold'
                                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                          }`}
                                        >
                                          {modulo}
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Nenhum módulo selecionado
                                  </span>
                                )}
                              </TableCell>

                              {/* Endereço com quebra e largura controlada */}
                              <TableCell className="w-[180px] min-w-[160px] max-w-[220px] text-xs text-slate-600 break-words line-clamp-2 print:hidden">
                                {cliente.endereco || '—'}
                              </TableCell>

                              {/* Status: Ativo em verde e Inativo em vermelho */}
                              <TableCell className="w-[95px] min-w-[90px] text-center print:text-[8pt] print:py-1">
                                <Badge
                                  variant="secondary"
                                  className={
                                    isInactive
                                      ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 font-semibold text-[11px]'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold text-[11px]'
                                  }
                                >
                                  {cliente.status ?? 'Ativo'}
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
                      Exibindo <strong className="text-slate-700">{filteredClientes.length}</strong>{' '}
                      de <strong className="text-slate-700">{clientes.length}</strong> cliente(s)
                    </span>
                    {lastGeneratedAt && (
                      <span className="text-xs text-slate-400">
                        Última busca fresca: {lastGeneratedAt.toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="hidden print:flex items-center justify-end px-4 py-2 border-t border-slate-300 text-[8pt] text-slate-600">
                    Total de {filteredClientes.length} cliente(s)
                  </div>
                </div>
              )}

              {/* Informação sobre os dados em tempo real */}
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 no-print">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                <span>
                  A mensalidade reflete <code className="text-slate-600">clientes.valor_total</code>{' '}
                  (valor oficial e confiável). A coluna <em>Data de assinatura do contrato</em> lê
                  diretamente <code className="text-slate-600">clientes.data_assinatura</code> sem
                  alterações. Os módulos são apresentados em etiquetas individuais na tela e em
                  colunas próprias na exportação em Excel. Qualquer alteração recente no banco é
                  carregada clicando em &quot;Atualizar Dados&quot;.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
