import { Link } from 'react-router-dom'
import { Plus, TrendingUp, Users, FileText, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useAppStore from '@/stores/main'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function Index() {
  const { clients, prospects } = useAppStore()

  const totalMRR = clients.reduce((acc, client) => acc + client.totalValue, 0)
  const activeClients = clients.length
  const activeProspects = prospects.filter((p) => p.status !== 'Fechado').length
  const pendingContracts = prospects.filter((p) => p.status === 'Em Negociação').length

  const recentActivity = [
    {
      id: 1,
      title: 'Novo contrato gerado',
      desc: 'Comercial Silva - R$ 849,70',
      time: 'Hoje, 14:30',
      icon: FileText,
      color: 'text-indigo-500 bg-indigo-100',
    },
    {
      id: 2,
      title: 'Reunião agendada',
      desc: 'Indústria Apex - Apresentação Comercial',
      time: 'Ontem, 16:00',
      icon: Users,
      color: 'text-orange-500 bg-orange-100',
    },
    {
      id: 3,
      title: 'Prospect adicionado',
      desc: 'Varejo Central',
      time: '18 Fev, 09:00',
      icon: Plus,
      color: 'text-emerald-500 bg-emerald-100',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Geral
          </h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta! Aqui está o resumo das suas vendas.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="bg-white">
            <Link to="/crm">Novo Contato</Link>
          </Button>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
            <Link to="/contratos">Gerar Contrato</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">MRR Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalMRR)}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% este mês
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">Empresas na base</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Prospects Ativos</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeProspects}</div>
            <p className="text-xs text-muted-foreground mt-1">No funil de vendas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Contratos Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pendingContracts}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando assinatura</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Últimos Clientes Adicionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(client.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(client.totalValue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {client.modules.length} Módulos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Feed de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 relative">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activity.color}`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.desc}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
