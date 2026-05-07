import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Users,
  FileText,
  ArrowUpRight,
  Target,
  Calendar,
  Activity,
  Briefcase,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDt = (dateString: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  // Ensure we don't get timezone shifts for dates
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export default function Index() {
  const [dashboardData, setDashboardData] = useState({
    clientes: [] as any[],
    leads: [] as any[],
    atividades: [] as any[],
    isLoading: true,
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [{ data: clientes }, { data: leads }, { data: atividades }] = await Promise.all([
          supabase.from('clientes').select('id, nome, valor_total, created_at, status'),
          supabase
            .from('crm_prospects')
            .select('id, empresa, contato_nome, status, data_followup, ultima_interacao'),
          supabase
            .from('atividades_comerciais')
            .select('id, demanda, data_atividade, created_at, cliente_nome, clientes(nome)')
            .order('created_at', { ascending: false })
            .limit(10),
        ])

        setDashboardData({
          clientes: clientes || [],
          leads: leads || [],
          atividades: atividades || [],
          isLoading: false,
        })
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err)
        setDashboardData((prev) => ({ ...prev, isLoading: false }))
      }
    }

    fetchDashboardData()
  }, [])

  const { clientes, leads, atividades, isLoading } = dashboardData

  const totalMRR = clientes.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0)
  const activeClients = clientes.length

  const openLeads = leads.filter(
    (l) => !['Fechado', 'Perdido', 'Cancelado'].includes(l.status),
  ).length

  const implantacoes = clientes.filter(
    (c) => c.status === 'Em Implantação' || c.status === 'Implantacao',
  ).length
  const implantacoesCount =
    implantacoes > 0
      ? implantacoes
      : clientes.filter((c) => {
          if (!c.created_at) return false
          const ageInDays =
            (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24)
          return ageInDays <= 30
        }).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingFollowups = leads
    .filter((l) => l.data_followup)
    .map((l) => ({ ...l, dateObj: new Date(l.data_followup) }))
    .filter(
      (l) =>
        l.dateObj >= today ||
        (l.dateObj < today && !['Fechado', 'Perdido', 'Cancelado'].includes(l.status)),
    )
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, 5)

  const funnelCounts = leads.reduce((acc: any, lead) => {
    const status = lead.status || 'Novo'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const colors = [
    '#3b82f6',
    '#8b5cf6',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
    '#f59e0b',
    '#10b981',
  ]
  const chartData = Object.keys(funnelCounts).map((key, idx) => ({
    name: key,
    value: funnelCounts[key],
    fill: colors[idx % colors.length],
  }))

  const chartConfig = chartData.reduce((acc: any, curr) => {
    acc[curr.name] = { label: curr.name, color: curr.fill }
    return acc
  }, {})

  const recentClients = [...clientes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const formattedAtividades = atividades.map((a) => ({
    id: a.id,
    title: a.demanda,
    desc: a.clientes?.nome || a.cliente_nome || 'Cliente não especificado',
    date: formatDt(a.created_at || a.data_atividade),
  }))

  return (
    <div
      className={cn(
        'space-y-8 transition-opacity duration-500 animate-fade-in',
        isLoading ? 'opacity-50' : 'opacity-100',
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Comercial
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumo executivo de vendas, contratos e prospecção em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            asChild
            className="bg-white hover:bg-slate-50 transition-colors"
          >
            <Link to="/crm">
              <Target className="h-4 w-4 mr-2" />
              Novo Lead
            </Link>
          </Button>
          <Button
            asChild
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md text-white transition-all hover:shadow-lg"
          >
            <Link to="/contratos">
              <FileText className="h-4 w-4 mr-2" />
              Gerar Contrato
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">MRR Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalMRR)}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Receita Recorrente
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Contratos Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">Clientes na base</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Leads em Aberto</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{openLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">Oportunidades no funil</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Implantações</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{implantacoesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Em andamento / Recentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Funil de Prospecção</CardTitle>
            <CardDescription>Distribuição dos leads por etapa do pipeline</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center">
                <Target className="h-10 w-10 mb-2 opacity-20" />
                <p>Nenhum dado no funil no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-slate-200/60 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Próximos Follow-ups
            </CardTitle>
            <CardDescription>Ações mapeadas para breve</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {upcomingFollowups.length > 0 ? (
              <div className="space-y-4">
                {upcomingFollowups.map((lead) => {
                  const isOverdue = lead.dateObj < today
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 hover:bg-slate-50/50 p-2 -mx-2 rounded-md transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{lead.empresa}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{lead.contato_nome}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-[10px] font-medium inline-flex items-center gap-1',
                            isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700',
                          )}
                        >
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          {formatDt(lead.data_followup)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1.5">{lead.status}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Calendar className="h-10 w-10 text-slate-200 mb-3" />
                <p>Nenhum follow-up programado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Últimos Contratos e Implantações</CardTitle>
            <CardDescription>Clientes recentes adicionados na base</CardDescription>
          </CardHeader>
          <CardContent>
            {recentClients.length > 0 ? (
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                        {client.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none text-slate-800">
                          {client.nome}
                        </p>
                        <p className="text-xs text-slate-500 mt-1.5">
                          Desde {formatDt(client.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(client.valor_total || 0)}
                      </p>
                      <p className="text-[10px] uppercase font-semibold text-slate-400 mt-1 tracking-wider">
                        {client.status || 'Ativo'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum cliente cadastrado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimos registros comerciais</CardDescription>
          </CardHeader>
          <CardContent>
            {formattedAtividades.length > 0 ? (
              <div className="space-y-6">
                {formattedAtividades.map((activity, idx) => (
                  <div key={activity.id || idx} className="flex gap-4 relative">
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                        idx % 2 === 0
                          ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100',
                      )}
                    >
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none text-slate-800">
                        {activity.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">{activity.desc}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-6">
                <Activity className="h-10 w-10 text-slate-200 mb-3" />
                <p>Nenhuma atividade recente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
