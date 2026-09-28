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
  Users,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  Printer,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClientesRelatorio,
  normalizePlanName,
  type ClienteRelatorio,
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

function downloadCSV(rows: ClienteRelatorio[]) {
  const headers = [
    'Nome / Razão Social',
    'CNPJ',
    'Duplicidade CNPJ',
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
    csvLines.push(
      [
        row.nome,
        row.cnpj ? formatCNPJ(row.cnpj) : '',
        dupText,
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
  const [hasGenerated, setHasGenerated] = useState(false)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null)

  // Filtros locais (após gerar)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all')
  const [planoFilter, setPlanoFilter] = useState<string>('all')
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [modulePresence, setModulePresence] = useState<'with' | 'without'>('with')

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

  // Descobrir catálogo completo + quaisquer módulos gravados nos clientes que não constem no catálogo
  const allModuleOptions = useMemo(() => {
    const map = new Map<string, string>() // normalized -> displayName

    // 1. Módulos do catálogo oficial (incluindo BI WEB, etc)
    for (const mod of MODULES) {
      map.set(normalizeModuleName(mod.name), mod.name)
    }
    // Garantir explicitamente BI WEB caso nome varie
    map.set('bi web', 'BI WEB')

    // 2. Módulos encontrados no banco
    for (const cliente of clientes) {
      const list = parseModulosToList(cliente.modulos)
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
  }, [clientes])

  // Opções de planos agrupadas por valor normalizado (TMS 100 ≡ TMS-100)
  // mantendo a exibição fiel e cobrindo todas as variações da base
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

      // 4. Filtro por módulo (com ou sem determinado módulo)
      if (selectedModule !== 'all') {
        const modulos = parseModulosToList(cliente.modulos)
        const hasMod = modulos.some((m) => normalizeModuleName(m) === selectedModule)
        if (modulePresence === 'with' && !hasMod) return false
        if (modulePresence === 'without' && hasMod) return false
      }

      return true
    })
  }, [clientes, searchQuery, statusFilter, planoFilter, selectedModule, modulePresence])

  // Estatísticas rápidas baseadas no filtro de módulo selecionado
  const moduleStats = useMemo(() => {
    if (selectedModule === 'all') return null
    let countWith = 0
    let countWithout = 0
    for (const c of clientes) {
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
  }, [clientes, selectedModule, allModuleOptions])

  const handleExport = () => {
    if (filteredClientes.length === 0) {
      toast.warning('Não há dados para exportar.')
      return
    }
    downloadCSV(filteredClientes)
    toast.success('Relatório de clientes exportado com sucesso!')
  }

  return (
    <div className="space-y-4 print:space-y-2">
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
                Visão consolidada de todos os clientes cadastrados com informações financeiras,
                contratuais, status atual e módulos adicionais contratados.
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
                    onClick={handleExport}
                    disabled={loading || filteredClientes.length === 0}
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
                refletindo as alterações recentes em mensalidades, módulos e status.
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
              {/* Barra de Filtros (Pesquisa, Status, Módulo) */}
              <div className="no-print bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <Filter className="h-3.5 w-3.5 text-[#1b4382]" />
                  Filtros e Análise de Módulos
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Busca textual */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Search className="h-3 w-3 text-slate-400" /> Buscar por nome ou CNPJ
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
                    <label className="text-xs font-medium text-slate-600">Plano</label>
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

                  {/* Condição do Módulo (Quem TEM vs Quem NÃO TEM) */}
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
                        <SelectItem value="with">Clientes que POSSUEM o módulo</SelectItem>
                        <SelectItem value="without">Clientes que NÃO POSSUEM</SelectItem>
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
                        {moduleStats.countWith} cliente(s) possuem
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        <XCircle className="h-3 w-3" />
                        {moduleStats.countWithout} cliente(s) não possuem
                      </span>
                    </div>

                    {(searchQuery ||
                      statusFilter !== 'all' ||
                      planoFilter !== 'all' ||
                      selectedModule !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-slate-500 hover:text-slate-900"
                        onClick={() => {
                          setSearchQuery('')
                          setStatusFilter('all')
                          setPlanoFilter('all')
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
                    Tente ajustar o termo de busca ou selecionar outro módulo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setPlanoFilter('all')
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
                            Nome / Razão Social
                          </TableHead>
                          <TableHead className="min-w-[140px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            CNPJ
                          </TableHead>
                          <TableHead className="min-w-[120px] text-right font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Mensalidade
                          </TableHead>
                          <TableHead className="min-w-[90px] text-center font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Vencimento
                          </TableHead>
                          <TableHead className="min-w-[90px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Código
                          </TableHead>
                          <TableHead className="min-w-[140px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Plano
                          </TableHead>
                          <TableHead className="min-w-[220px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Módulos Adicionais
                          </TableHead>
                          <TableHead className="min-w-[160px] font-semibold text-slate-700 print:hidden">
                            Endereço
                          </TableHead>
                          <TableHead className="min-w-[90px] text-center font-semibold text-slate-700 print:text-[8pt] print:py-1">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClientes.map((cliente) => {
                          const modulos = parseModulosToList(cliente.modulos)
                          const isInactive =
                            cliente.status === 'Inativo' ||
                            cliente.status === 'Cancelado' ||
                            cliente.status?.toLowerCase() === 'inativo' ||
                            cliente.status?.toLowerCase() === 'cancelado'

                          return (
                            <TableRow
                              key={cliente.id}
                              className="hover:bg-slate-50/60 transition-colors print:hover:bg-transparent print:break-inside-avoid"
                            >
                              <TableCell className="font-medium text-slate-800 print:text-[8pt] print:py-1">
                                <div className="flex flex-col gap-0.5">
                                  <span>{cliente.nome}</span>
                                  {cliente.cnpj_duplicado_count &&
                                    cliente.cnpj_duplicado_count > 1 && (
                                      <Badge
                                        variant="outline"
                                        className="w-fit bg-amber-50 text-amber-800 border-amber-300 text-[9px] py-0 px-1 font-medium"
                                        title={`Há ${cliente.cnpj_duplicado_count} cadastros com este mesmo CNPJ.`}
                                      >
                                        CNPJ duplicado ({cliente.cnpj_duplicado_count} registros)
                                      </Badge>
                                    )}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
                                {cliente.cnpj ? formatCNPJ(cliente.cnpj) : '—'}
                              </TableCell>
                              <TableCell className="text-right font-medium text-slate-800 print:text-[8pt] print:py-1">
                                {cliente.valor_total != null && cliente.valor_total > 0
                                  ? formatCurrency(cliente.valor_total)
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-center text-slate-600 print:text-[8pt] print:py-1">
                                {cliente.vencimento_mensal != null
                                  ? `${cliente.vencimento_mensal}º`
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
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
                              <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
                                {cliente.plano_descricao &&
                                cliente.plano_descricao !== 'Não informado' ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{cliente.plano_descricao}</span>
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
                                    Nenhum módulo selecionado
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-slate-600 max-w-[200px] truncate print:hidden">
                                {cliente.endereco || '—'}
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
                  (valor oficial e confiável). Os módulos listam todos os adicionais gravados do
                  cliente, e qualquer alteração recente é obtida clicando em &quot;Atualizar
                  Dados&quot;.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
