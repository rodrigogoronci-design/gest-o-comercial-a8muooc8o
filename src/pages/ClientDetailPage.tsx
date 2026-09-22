import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { formatCNPJ, formatDate } from '@/lib/formatters'
import { getImplementacaoByCliente } from '@/services/implementacoes'
import { getSolicitacoesByCliente } from '@/services/solicitacoes_servico'
import { getHistoricoByCliente } from '@/services/historico_contratos'
import {
  getAtendimentosByCliente,
  type Atendimento,
  type AtendimentoAnexo,
} from '@/services/atendimentos'
import {
  ensureChecklistForClient,
  getStatusCliente,
  type DocumentacaoAdesaoItem,
} from '@/services/documentacao-adesao'
import { ADESAO_CHECKLIST } from '@/lib/document-requirements'
import { HistoricoAditivos } from '@/components/HistoricoAditivos'
import { DocumentacaoAdesaoTab } from '@/components/DocumentacaoAdesaoTab'

import {
  ChevronRight,
  ArrowLeft,
  Building2,
  Calendar,
  Layers,
  FileText,
  Mail,
  User,
  ExternalLink,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Paperclip,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  MoreHorizontal,
  Circle,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Sub-dados para abas
  const [implementacao, setImplementacao] = useState<any>(null)
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [docItems, setDocItems] = useState<DocumentacaoAdesaoItem[]>([])
  const [docStatusGeral, setDocStatusGeral] = useState<string>('Aguardando documentação')
  const [expandedAtendimentos, setExpandedAtendimentos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return

    let isMounted = true
    setLoading(true)
    setErrorMsg(null)

    const fetchAll = async () => {
      try {
        // Busca cliente
        const { data: cData, error: cErr } = await supabase
          .from('clientes')
          .select('*, planos_saude(id, descricao, codigo)')
          .eq('id', id)
          .single()

        if (cErr) throw cErr
        if (!isMounted) return
        setClient(cData)

        // Busca paralela de dados relacionados (somente leitura)
        const [implRes, solRes, histRes, atRes, docRes, docStRes] = await Promise.allSettled([
          getImplementacaoByCliente(id),
          getSolicitacoesByCliente(id),
          getHistoricoByCliente(id),
          getAtendimentosByCliente(id),
          ensureChecklistForClient(id),
          getStatusCliente(id),
        ])

        if (!isMounted) return

        if (implRes.status === 'fulfilled') setImplementacao(implRes.value)
        if (solRes.status === 'fulfilled') setSolicitacoes(solRes.value || [])
        if (histRes.status === 'fulfilled') setHistorico(histRes.value || [])
        if (atRes.status === 'fulfilled') setAtendimentos(atRes.value || [])
        if (docRes.status === 'fulfilled') setDocItems(docRes.value || [])
        if (docStRes.status === 'fulfilled')
          setDocStatusGeral(docStRes.value?.status_geral || 'Aguardando documentação')
      } catch (err: any) {
        if (!isMounted) return
        console.error('Erro ao carregar detalhes do cliente:', err)
        setErrorMsg(err.message || 'Cliente não encontrado.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAll()

    return () => {
      isMounted = false
    }
  }, [id])

  const getBackListUrl = () => {
    return sessionStorage.getItem('clients_list_url') || '/clientes'
  }

  const handleBackToList = () => {
    navigate(getBackListUrl())
  }

  const handleOpenLegacySheet = () => {
    // Redireciona para a lista preservando busca/filtros/ordenação junto de sheetClient={id}
    const savedUrl = getBackListUrl()
    const separator = savedUrl.includes('?') ? '&' : '?'
    navigate(`${savedUrl}${separator}sheetClient=${id}`)
  }

  // Normalização de módulos contratados
  const contractedModulesList = useMemo(() => {
    if (!client) return []
    const m = client.modulos
    if (!m) return []
    if (Array.isArray(m)) {
      return m.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean)
    }
    if (typeof m === 'object') {
      const ads = Array.isArray(m.adicionais)
        ? m.adicionais.map((item: any) => (typeof item === 'string' ? item : item.name))
        : []
      return ads.filter(Boolean)
    }
    return []
  }, [client])

  // Contagem de CNPJs (Matriz + Filiais)
  const filiaisList: any[] = useMemo(() => {
    if (!client) return []
    const f = client.filiais_detalhes
    if (Array.isArray(f)) return f
    if (client.modulos?.filiais_detalhes && Array.isArray(client.modulos.filiais_detalhes)) {
      return client.modulos.filiais_detalhes
    }
    return []
  }, [client])

  const totalCnpjsCount = 1 + filiaisList.length

  // Nome do plano vigente
  const planoNome = useMemo(() => {
    if (!client) return 'Não informado'
    return client.planos_saude?.descricao || client.modulos?.plano_base || 'Não informado'
  }, [client])

  // Iniciais para avatar neutro
  const avatarInitials = useMemo(() => {
    if (!client?.nome) return 'CL'
    const words = client.nome.trim().split(/\s+/)
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }, [client])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Carregando dados do cliente...</p>
      </div>
    )
  }

  if (errorMsg || !client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Cliente não encontrado</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          {errorMsg || 'Identificador inválido ou registro inexistente.'}
        </p>
        <Button onClick={handleBackToList} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para clientes
        </Button>
      </div>
    )
  }

  const isInactive = client.status?.toLowerCase() === 'inativo' || !!client.data_cancelamento

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* TOP BAR / BREADCRUMB + BOTÃO VOLTAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link
              to={getBackListUrl()}
              className="hover:text-slate-900 transition-colors font-medium flex items-center gap-1"
            >
              Clientes
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">
              {client.nome}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToList}
              className="bg-white hover:bg-slate-50 text-slate-700 h-8 text-xs shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Voltar para clientes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenLegacySheet}
              className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 h-8 text-xs shadow-sm"
              title="Acessa todas as ações mutáveis no painel completo anterior"
            >
              Abrir visualização anterior
            </Button>
          </div>
        </div>

        {/* CARD DE CABEÇALHO */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-5 justify-between">
              <div className="flex items-start sm:items-center gap-4">
                {/* Avatar / Iniciais neutras — NUNCA inventar logo */}
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-xl font-bold text-indigo-700">{avatarInitials}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {client.nome}
                    </h1>
                    {isInactive ? (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 text-xs"
                      >
                        <Ban className="h-3 w-3 mr-1" /> Inativo
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                        Cliente ativo
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono">CNPJ {formatCNPJ(client.cnpj)}</span>
                    {client.email ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" /> {client.email}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">E-mail: Não informado</span>
                    )}
                    <span className="flex items-center gap-1 text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Responsável: {client.rep_nome || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 CARDS NA SEQUÊNCIA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Plano */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Layers className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-slate-500 uppercase block tracking-wider">
                  Plano
                </span>
                <span className="text-lg font-bold text-slate-900 truncate block" title={planoNome}>
                  {planoNome}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Mensalidade (REGRA CRÍTICA: NÃO usar valor_total — exibir A validar se não confiável) */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-emerald-700 font-bold text-lg">R$</span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-slate-500 uppercase block tracking-wider">
                  Mensalidade
                </span>
                <span className="text-base font-bold text-amber-700 block">A validar</span>
                <span className="text-[10px] text-slate-400">Fonte confiável pendente</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Módulos */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-violet-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-slate-500 uppercase block tracking-wider">
                  Módulos
                </span>
                <span className="text-lg font-bold text-slate-900 block">
                  {contractedModulesList.length > 0
                    ? `${contractedModulesList.length} módulo${contractedModulesList.length > 1 ? 's' : ''}`
                    : 'Nenhum'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: CNPJs */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-sky-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-slate-500 uppercase block tracking-wider">
                  CNPJs
                </span>
                <span className="text-lg font-bold text-slate-900 block">
                  {totalCnpjsCount} CNPJ{totalCnpjsCount > 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-slate-400">
                  1 matriz{filiaisList.length > 0 ? ` + ${filiaisList.length} filial(is)` : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAIXA "PRÓXIMA AÇÃO" INFORMATIVA (REGRA CRÍTICA: NÃO inferir por status/Kanban) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                PRÓXIMA AÇÃO
              </span>
              <span className="text-sm font-semibold text-slate-800">Próxima ação: A validar</span>
              <span className="text-xs text-slate-500 block">
                Responsável: {client.rep_nome || 'A validar'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs bg-white text-slate-700">
                  <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" /> Outras ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Ações do Cliente</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-xs"
                  onClick={handleOpenLegacySheet}
                >
                  Abrir visualização anterior (ações completas)
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs text-slate-400">
                  Modo consulta ativo neste lote
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* CINCO ABAS DA NOVA PÁGINA COM NOMES EXATOS */}
        <Tabs defaultValue="visao-geral" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white border border-slate-200 text-xs p-1 h-auto rounded-xl shadow-sm">
            <TabsTrigger
              value="visao-geral"
              className="text-xs py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="comercial-plano"
              className="text-xs py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              Comercial e Plano
            </TabsTrigger>
            <TabsTrigger
              value="atendimentos"
              className="text-xs py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              Atendimentos
            </TabsTrigger>
            <TabsTrigger
              value="implantacao-execucao"
              className="text-xs py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              Implantação e Execução
            </TabsTrigger>
            <TabsTrigger
              value="financeiro-historico"
              className="text-xs py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              Financeiro e Histórico
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: Visão Geral */}
          <TabsContent value="visao-geral" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Coluna Principal: Resumo do cliente, Pendências e Contatos */}
              <div className="lg:col-span-2 space-y-4">
                {/* Resumo do cliente */}
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-600" /> Resumo do cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 divide-y divide-slate-100 text-sm">
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-slate-500">Plano vigente</span>
                      <span className="font-semibold text-slate-800">{planoNome}</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-slate-500">Módulos contratados</span>
                      <span className="font-semibold text-slate-800">
                        {contractedModulesList.length > 0
                          ? `${contractedModulesList.length} módulos`
                          : 'Nenhum'}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-slate-500">Vencimento mensal</span>
                      <span className="font-semibold text-slate-800">
                        {client.vencimento_mensal
                          ? `Todo dia ${client.vencimento_mensal}`
                          : 'Não informado'}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-slate-500">Situação da implantação</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {implementacao?.status ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {implementacao.status}
                          </>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                            A validar
                          </span>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pendências */}
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" /> Pendências
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm space-y-3">
                    {docStatusGeral !== 'Recebida e Aprovada' ? (
                      <div className="flex items-start justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800 text-xs">
                            Documentação de Adesão
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Status atual: {docStatusGeral}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Em aberto
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Nenhuma pendência crítica registrada.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Contatos */}
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" /> Contatos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">
                          {client.rep_nome || 'Não informado'}
                        </p>
                        <p className="text-[11px] text-slate-500">Representante Legal</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" /> {client.email}
                          </span>
                        )}
                        {client.telefone && (
                          <span className="font-mono text-slate-700">{client.telefone}</span>
                        )}
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        >
                          Contato principal
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Lateral: Últimas movimentações */}
              <div>
                <Card className="border-slate-200 shadow-sm bg-white h-full flex flex-col">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-600" /> Últimas movimentações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 text-sm">
                    {historico.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Nenhuma movimentação registrada.
                      </p>
                    ) : (
                      <div className="space-y-4 border-l-2 border-indigo-100 pl-3 ml-1">
                        {historico.slice(0, 5).map((item, idx) => (
                          <div key={item.id || idx} className="space-y-1 relative">
                            <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-white" />
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-800">
                                {item.tipo || 'Movimentação'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.data_solicitacao ? formatDate(item.data_solicitacao) : ''}
                              </span>
                            </div>
                            {item.observacoes && (
                              <p className="text-[11px] text-slate-600 line-clamp-2">
                                {item.observacoes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ABA 2: Comercial e Plano */}
          <TabsContent value="comercial-plano" className="mt-4 space-y-4">
            {/* Pacote Contratado */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" /> Pacote Contratado
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Plano e módulos contratados pela empresa.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-600 font-semibold block">Plano Base</span>
                    <span className="text-base font-bold text-indigo-900">{planoNome}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs"
                  >
                    Vigente
                  </Badge>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Módulos Vinculados
                  </span>
                  {contractedModulesList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {contractedModulesList.map((modName: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 border-slate-200 text-xs"
                        >
                          {modName}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Nenhum módulo adicional vinculado.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CNPJs Vinculados */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" /> CNPJs Vinculados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] uppercase"
                    >
                      Matriz
                    </Badge>
                    <span className="font-mono text-sm font-medium text-slate-800">
                      {formatCNPJ(client.cnpj)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{client.nome}</span>
                </div>

                {filiaisList.map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase"
                      >
                        Filial
                      </Badge>
                      <span className="font-mono text-xs font-medium text-slate-700">
                        {formatCNPJ(f.cnpj)}
                      </span>
                    </div>
                    {f.nome && <span className="text-xs text-slate-500">{f.nome}</span>}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Assinatura Eletrônica (somente exibição do link) */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" /> Assinatura Eletrônica
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Exibição de link para formalização e data de assinatura.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500">Data de Assinatura</span>
                  <span className="font-semibold text-slate-800">
                    {client.data_assinatura ? formatDate(client.data_assinatura) : 'Não informada'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-slate-500 block mb-0.5">Link de Assinatura</span>
                    {client.link_assinatura ? (
                      <a
                        href={client.link_assinatura}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 truncate"
                      >
                        {client.link_assinatura} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Nenhum link registrado.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contrato Inicial (Apresentação) */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" /> Contrato Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm">
                {client.contrato_url ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                      <FileText className="h-4 w-4 text-indigo-500" /> Documento contratual anexado
                    </span>
                    <a
                      href={client.contrato_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      Visualizar documento <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Nenhum contrato anexado para este cliente.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* SUBSEÇÃO "Documentos" renderizando DocumentacaoAdesaoTab (preservando a correção 0.0.812) */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" /> Documentos de Adesão
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Subseção de documentação (DocumentacaoAdesaoTab) integrada à aba Comercial e
                  Plano.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <DocumentacaoAdesaoTab
                  clienteId={client.id}
                  clientName={client.nome}
                  telefone={client.telefone || ''}
                  readOnly
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: Atendimentos */}
          <TabsContent value="atendimentos" className="mt-4 space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" /> Atendimentos do Cliente (Modo
                  Consulta)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Visualização somente leitura das interações, e-mails corporativos e chamados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-sm">
                {atendimentos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    Nenhum atendimento registrado para este cliente.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {atendimentos.map((at, idx) => {
                      const isExpanded = !!expandedAtendimentos[at.id]
                      const isImported = Boolean(at.origem)
                      const anexosCount = Array.isArray(at.anexos)
                        ? at.anexos.length
                        : at.documento_url
                          ? 1
                          : 0

                      return (
                        <div key={at.id || idx} className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-800">
                                  {at.assunto || at.solicitacao || 'Atendimento'}
                                </span>
                                {isImported && (
                                  <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
                                    ✉ E-mail corporativo
                                  </Badge>
                                )}
                                {at.situacao && (
                                  <Badge variant="outline" className="text-[10px] text-slate-600">
                                    {at.situacao}
                                  </Badge>
                                )}
                                {at.enviado_implantacao && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-emerald-50 text-emerald-700 text-[10px]"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Enviado à Implantação
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {formatDate(at.data_atendimento)}
                                </span>
                                {at.responsavel && <span>Resp: {at.responsavel}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {anexosCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-indigo-600 bg-indigo-50"
                                >
                                  <Paperclip className="h-3 w-3 mr-1" /> {anexosCount} anexo(s)
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-slate-500"
                                onClick={() =>
                                  setExpandedAtendimentos((prev) => ({
                                    ...prev,
                                    [at.id]: !prev[at.id],
                                  }))
                                }
                              >
                                {isExpanded ? 'Recolher' : 'Detalhes'}
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 bg-slate-50/50 p-3 rounded">
                              {at.resumo && (
                                <p>
                                  <strong className="text-slate-700">Resumo: </strong>
                                  {at.resumo}
                                </p>
                              )}
                              {at.relatorio && (
                                <p>
                                  <strong className="text-slate-700">Relatório/Detalhes: </strong>
                                  {at.relatorio}
                                </p>
                              )}
                              {at.documento_url && (
                                <a
                                  href={at.documento_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  <FileText className="h-3.5 w-3.5" /> Abrir documento anexo
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 4: Implantação e Execução */}
          <TabsContent value="implantacao-execucao" className="mt-4 space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" /> Implantação e Execução
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Dados de implementações e etapas vinculadas (somente leitura).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-4">
                {implementacao ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-xs text-slate-500 block">Status da Implantação</span>
                        <span className="font-semibold text-slate-800">
                          {implementacao.status || 'Sem evidência registrada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Progresso</span>
                        <span className="font-semibold text-slate-800">
                          {typeof implementacao.progresso === 'number'
                            ? `${implementacao.progresso}%`
                            : 'Sem evidência registrada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Responsável</span>
                        <span className="font-semibold text-slate-800">
                          {implementacao.colaboradores?.nome || 'Sem evidência registrada'}
                        </span>
                      </div>
                    </div>

                    {Array.isArray(implementacao.implementacao_etapas) &&
                    implementacao.implementacao_etapas.length > 0 ? (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                          Etapas Cadastradas
                        </span>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                          {implementacao.implementacao_etapas.map((et: any, i: number) => (
                            <div key={i} className="p-3 flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800">{et.titulo}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {et.status || 'Não iniciada'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Etapas: Sem evidência registrada
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm font-medium text-slate-600">Sem evidência registrada</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Nenhum processo de implantação ativo ou concluído com comprovação formal no
                      sistema.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 5: Financeiro e Histórico */}
          <TabsContent value="financeiro-historico" className="mt-4 space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" /> Cobranças e Solicitações de
                  Serviço
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Cobranças programadas e solicitações com valor associadas ao cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-4">
                {/* Cobranças */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Cobranças Programadas
                  </span>
                  {Array.isArray(client.cobrancas) && client.cobrancas.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {client.cobrancas.map((cob: any, i: number) => (
                        <div key={i} className="p-3 flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            Vencimento:{' '}
                            {cob.data_vencimento
                              ? formatDate(cob.data_vencimento)
                              : 'Não informado'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {cob.valor ? `R$ ${cob.valor.toFixed(2)}` : 'Não informado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Nenhuma cobrança programada registrada.
                    </p>
                  )}
                </div>

                {/* Solicitações */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Solicitações de Serviço com Valor
                  </span>
                  {solicitacoes.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {solicitacoes.map((sol, i) => (
                        <div
                          key={sol.id || i}
                          className="p-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-slate-800 block">
                              {sol.descricao || sol.tipo}
                            </span>
                            <span className="text-slate-400 text-[10px]">{sol.status}</span>
                          </div>
                          <span className="font-semibold text-slate-800">
                            {sol.valor ? `R$ ${Number(sol.valor).toFixed(2)}` : 'Sem valor'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Nenhuma solicitação de serviço cadastrada.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Contratos & Aditivos */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" /> Histórico de Contratos & Aditivos
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Registros históricos gerados no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <HistoricoAditivos clienteId={client.id} />
              </CardContent>
            </Card>

            {/* Bloco de contrato cancelado (se houver) */}
            {(client.data_cancelamento || client.motivo_cancelamento || isInactive) && (
              <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-red-700">
                  <Ban className="h-4 w-4" />
                  <span>Contrato Cancelado</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
                  <div>
                    <span className="font-medium text-red-600 block">Data do Cancelamento:</span>
                    <span>
                      {client.data_cancelamento
                        ? formatDate(client.data_cancelamento)
                        : 'Não informada'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-red-600 block">Motivo do Cancelamento:</span>
                    <span>{client.motivo_cancelamento || 'Não informado'}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
