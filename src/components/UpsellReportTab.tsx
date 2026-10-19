import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  FileSpreadsheet,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Target,
  Sparkles,
  Layers,
  PhoneCall,
  Loader2,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCNPJ, formatCurrency, formatDateOnly } from '@/lib/formatters'
import {
  buildUpsellQueue,
  type UpsellClienteLinha,
  type CampanhaUpsellResumo,
} from '@/lib/module-normalizer'
import { exportFilaComercialUpsellExcel } from '@/services/export-upsell-excel'

export function UpsellReportTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null)

  const [rawClientes, setRawClientes] = useState<any[]>([])
  const [historicosMap, setHistoricosMap] = useState<Map<string, any[]>>(new Map())

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [campanhaFilter, setCampanhaFilter] = useState<string>('all')
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all')

  const loadData = async () => {
    try {
      setLoading(true)

      // 1. Buscar todos os clientes da base oficial
      const { data: clientesData, error: cError } = await supabase
        .from('clientes')
        .select(`
          id,
          nome,
          cnpj,
          email,
          telefone,
          rep_nome,
          valor_total,
          status,
          data_assinatura,
          modulos,
          plano_id,
          filiais_detalhes,
          diagnostico,
          planos_saude (descricao, codigo)
        `)
        .order('nome', { ascending: true })

      if (cError) throw cError

      // Formatar plano_descricao
      const clientesFormatados = (clientesData || []).map((c: any) => {
        let planoDesc = 'Não informado'
        if (c.modulos && typeof c.modulos === 'object' && !Array.isArray(c.modulos)) {
          if (c.modulos.plano_base && typeof c.modulos.plano_base === 'string') {
            planoDesc = c.modulos.plano_base.trim()
          }
        }
        if (planoDesc === 'Não informado' && c.planos_saude) {
          planoDesc = c.planos_saude.descricao || c.planos_saude.codigo || 'Não informado'
        }
        return {
          ...c,
          plano_descricao: planoDesc,
        }
      })

      // 2. Buscar históricos de contratos recentes (para capturar aditivos e filiais com DF-e)
      const { data: histData, error: hError } = await supabase
        .from('historico_contratos')
        .select('cliente_id, tipo, modulos, observacoes')

      if (hError) throw hError

      const hMap = new Map<string, any[]>()
      for (const h of histData || []) {
        if (!h.cliente_id) continue
        const arr = hMap.get(h.cliente_id) || []
        arr.push(h)
        hMap.set(h.cliente_id, arr)
      }

      setRawClientes(clientesFormatados)
      setHistoricosMap(hMap)
      setHasGenerated(true)
      setLastGeneratedAt(new Date())
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao carregar dados de upsell: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // Gera a fila comercial pura com o motor normalizador
  const { filaComercial, campanhasResumo } = useMemo(() => {
    if (rawClientes.length === 0) {
      return { filaComercial: [], campanhasResumo: [] }
    }
    return buildUpsellQueue(rawClientes, historicosMap)
  }, [rawClientes, historicosMap])

  // Filtragem na tela
  const filteredFila = useMemo(() => {
    return filaComercial.filter((item) => {
      // 1. Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNome = item.clienteNome.toLowerCase().includes(q)
        const matchCnpj =
          item.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, '')) || item.cnpj.includes(q)
        const matchPlano = item.planoDescricao.toLowerCase().includes(q)
        const matchOferta = item.ofertaInicial.toLowerCase().includes(q)
        if (!matchNome && !matchCnpj && !matchPlano && !matchOferta) return false
      }

      // 2. Filtro Campanha / Oferta Inicial
      if (campanhaFilter !== 'all') {
        if (item.ofertaInicial !== campanhaFilter) return false
      }

      // 3. Filtro Prioridade
      if (prioridadeFilter !== 'all') {
        if (String(item.prioridade) !== prioridadeFilter) return false
      }

      return true
    })
  }, [filaComercial, searchQuery, campanhaFilter, prioridadeFilter])

  const handleExportExcel = async () => {
    if (rawClientes.length === 0) {
      toast.warning('Não há dados para exportar.')
      return
    }
    setExportingExcel(true)
    try {
      await exportFilaComercialUpsellExcel(rawClientes, historicosMap)
      toast.success('Fila Comercial de Upsell exportada com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao exportar planilha de upsell: ' + (err.message || ''))
    } finally {
      setExportingExcel(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#f37021]" />
                Fila Comercial de Upsell da Base
              </CardTitle>
              <CardDescription className="mt-1">
                Geração inteligente da fila de abordagem comercial por cliente. Cruza com os módulos
                realmente contratados (incluindo pacotes, planos, filiais e aditivos) para garantir
                que nenhum cliente receba oferta de algo que já possui.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={loadData}
                disabled={loading}
                className="bg-[#1b4382] hover:bg-[#1b4382]/90 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCw className="h-4 w-4 mr-2" />
                )}
                {hasGenerated ? 'Atualizar Fila' : 'Gerar Fila de Upsell'}
              </Button>

              <Button
                onClick={handleExportExcel}
                disabled={loading || exportingExcel || rawClientes.length === 0}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {exportingExcel ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Exportar Planilha Oficial (.xlsx)
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!hasGenerated && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <div className="rounded-full bg-orange-50 p-4 mb-4 text-[#f37021]">
                <Target className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                Gerar Fila Comercial de Upsell
              </p>
              <p className="text-sm text-slate-500 max-w-lg mt-1 mb-5">
                O sistema analisará toda a base ativa, identificará os módulos reais de cada cliente
                e montará a sequência ideal de campanhas (DF-e, SL-Trip, BI, Controle de Viagem,
                Frota e Clientes Antigos), eliminando falsos positivos.
              </p>
              <Button onClick={loadData} className="bg-[#1b4382] hover:bg-[#1b4382]/90 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Fila Agora
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1b4382] mb-3" />
              <span className="text-sm font-medium text-slate-600">
                Cruzando contratos, planos e módulos com normalização inteligente...
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Garantindo 100% de fidedignidade nas ofertas.
              </span>
            </div>
          )}

          {hasGenerated && !loading && (
            <div className="space-y-5">
              {/* Cards das 6 Campanhas */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[#1b4382]" />
                  Resumo das Campanhas por Módulo
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {campanhasResumo.map((camp) => {
                    const isSelected = campanhaFilter === camp.campanha
                    return (
                      <button
                        key={camp.ordem}
                        type="button"
                        onClick={() => setCampanhaFilter(isSelected ? 'all' : camp.campanha)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#1b4382] ring-2 ring-[#1b4382]/30 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge
                            variant="secondary"
                            className="bg-white border text-[10px] px-1.5 py-0 text-slate-600 font-bold"
                          >
                            P{camp.ordem}
                          </Badge>
                          <span className="text-xs font-bold text-slate-900">
                            {camp.clientesElegiveis}
                          </span>
                        </div>
                        <div
                          className="font-semibold text-xs text-slate-800 truncate"
                          title={camp.campanha}
                        >
                          {camp.campanha}
                        </div>
                        <div
                          className="text-[10px] text-slate-500 mt-0.5 truncate"
                          title={camp.objetivoContato}
                        >
                          {camp.objetivoContato}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Barra de Filtros */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <Filter className="h-3.5 w-3.5 text-[#1b4382]" />
                    Filtros da Fila Comercial
                  </div>
                  {(searchQuery || campanhaFilter !== 'all' || prioridadeFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-slate-500 hover:text-slate-900"
                      onClick={() => {
                        setSearchQuery('')
                        setCampanhaFilter('all')
                        setPrioridadeFilter('all')
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Search className="h-3 w-3 text-slate-400" /> Buscar cliente ou CNPJ
                    </label>
                    <Input
                      placeholder="Nome, CNPJ, plano..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 bg-white text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Oferta Inicial (Campanha)
                    </label>
                    <Select value={campanhaFilter} onValueChange={setCampanhaFilter}>
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Todas as campanhas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as campanhas</SelectItem>
                        {campanhasResumo.map((c) => (
                          <SelectItem key={c.ordem} value={c.campanha}>
                            P{c.ordem} - {c.campanha} ({c.clientesElegiveis})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Prioridade</label>
                    <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                      <SelectTrigger className="h-9 bg-white text-sm">
                        <SelectValue placeholder="Todas as prioridades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as prioridades</SelectItem>
                        <SelectItem value="1">Prioridade 1 (DF-e)</SelectItem>
                        <SelectItem value="2">Prioridade 2 (SL-Trip)</SelectItem>
                        <SelectItem value="3">Prioridade 3 (BI)</SelectItem>
                        <SelectItem value="4">Prioridade 4 (Controle de Viagem)</SelectItem>
                        <SelectItem value="5">Prioridade 5 (Frota)</SelectItem>
                        <SelectItem value="6">Prioridade 6 (Clientes antigos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tabela da Fila */}
              {filteredFila.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-slate-200 rounded-lg bg-slate-50/50">
                  <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Nenhum cliente corresponde aos filtros aplicados
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-[640px]">
                    <Table className="relative w-full border-collapse">
                      <TableHeader className="sticky top-0 z-20 shadow-sm">
                        <TableRow className="bg-[#1b4382] hover:bg-[#1b4382] border-b-2 border-[#f37021] text-white">
                          <TableHead className="w-[60px] text-center font-semibold text-white">
                            Ordem
                          </TableHead>
                          <TableHead className="w-[85px] text-center font-semibold text-white">
                            Prioridade
                          </TableHead>
                          <TableHead className="w-[220px] font-semibold text-white">
                            Cliente
                          </TableHead>
                          <TableHead className="w-[140px] font-semibold text-white">CNPJ</TableHead>
                          <TableHead className="w-[120px] font-semibold text-white">
                            Plano
                          </TableHead>
                          <TableHead className="w-[110px] text-right font-semibold text-white">
                            Mensalidade
                          </TableHead>
                          <TableHead className="w-[150px] font-semibold text-white">
                            Oferta Inicial
                          </TableHead>
                          <TableHead className="w-[200px] font-semibold text-white">
                            Módulos Atuais Contratados
                          </TableHead>
                          <TableHead className="w-[180px] font-semibold text-white">
                            Outras Oportunidades
                          </TableHead>
                          <TableHead className="w-[260px] font-semibold text-white">
                            Pergunta de Diagnóstico Sugerida
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFila.map((linha, idx) => {
                          const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                          return (
                            <TableRow
                              key={linha.clienteId}
                              className={`${rowBg} hover:bg-blue-50/40 transition-colors`}
                            >
                              <TableCell className="text-center font-bold text-slate-700 text-xs">
                                {linha.ordem}
                              </TableCell>
                              <TableCell className="text-center text-xs">
                                <Badge
                                  variant="outline"
                                  className="border-[#f37021] text-[#f37021] font-bold text-[10px]"
                                >
                                  P{linha.prioridade}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-slate-800 text-xs">
                                <div className="leading-snug">{linha.clienteNome}</div>
                                {linha.contatoNome && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Contato: {linha.contatoNome}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                                {linha.cnpj ? formatCNPJ(linha.cnpj) : '—'}
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">
                                {linha.planoDescricao}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-slate-900 text-xs whitespace-nowrap">
                                {formatCurrency(linha.mensalidade)}
                              </TableCell>
                              <TableCell className="text-xs">
                                <Badge className="bg-[#1b4382] hover:bg-[#1b4382] text-white text-[11px] font-bold">
                                  {linha.ofertaInicial}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                                  {linha.modulosAtuais.map((m, mIdx) => (
                                    <Badge
                                      key={mIdx}
                                      variant="secondary"
                                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-1 py-0 font-normal"
                                    >
                                      {m}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                <div className="flex flex-wrap gap-1">
                                  {linha.outrasOportunidades.length > 0 ? (
                                    linha.outrasOportunidades.map((op, oIdx) => (
                                      <Badge
                                        key={oIdx}
                                        variant="outline"
                                        className="text-[10px] px-1 py-0 text-slate-700 bg-white"
                                      >
                                        {op}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[11px] italic">
                                      Nenhuma
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 leading-snug">
                                {linha.perguntaDiagnostico}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                    <span>
                      Exibindo <strong>{filteredFila.length}</strong> de{' '}
                      <strong>{filaComercial.length}</strong> clientes na fila de upsell
                    </span>
                    {lastGeneratedAt && (
                      <span>Última atualização: {lastGeneratedAt.toLocaleTimeString('pt-BR')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
