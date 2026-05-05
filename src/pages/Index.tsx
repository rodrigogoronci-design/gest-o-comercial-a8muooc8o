import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  TrendingUp,
  Users,
  FileText,
  ArrowUpRight,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { calculateFinancialScore } from '@/lib/financial-score'
import { formatCurrency, formatDate } from '@/lib/formatters'
import useAppStore from '@/stores/main'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export default function Index() {
  const { clients, prospects } = useAppStore()
  const [recebimentos, setRecebimentos] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRecebimentos = async () => {
      const { data } = await supabase.from('recebimentos').select('*')
      if (data) setRecebimentos(data)
    }
    fetchRecebimentos()
  }, [])

  const clientScores = useMemo(() => {
    return clients.map((client) => {
      const clientReceipts = recebimentos.filter(
        (r) => r.cliente_id === client.id || (r.cnpj && r.cnpj === client.cnpj),
      )
      const scoreData = calculateFinancialScore(clientReceipts)
      return {
        ...client,
        ...scoreData,
      }
    })
  }, [clients, recebimentos])

  const totalMRR = clients.reduce(
    (acc, client) => acc + (client.totalValue || client.valor_total || 0),
    0,
  )
  const activeClients = clients.length
  const pendingContracts = prospects.filter((p) => p.status === 'Em Negociação').length

  const clientesEmRisco = clientScores.filter(
    (c) => c.classification === 'Risco' || c.classification === 'Atenção',
  ).length
  const inadimplenciaPercent =
    activeClients > 0 ? Math.round((clientesEmRisco / activeClients) * 100) : 0

  const classificationCounts = {
    Premium: 0,
    Regular: 0,
    Atenção: 0,
    Risco: 0,
    'Sem Histórico': 0,
  }

  clientScores.forEach((c) => {
    if (c.classification in classificationCounts) {
      classificationCounts[c.classification as keyof typeof classificationCounts]++
    }
  })

  const chartData = [
    { name: 'Premium', value: classificationCounts.Premium, fill: 'hsl(var(--chart-2))' },
    { name: 'Regular', value: classificationCounts.Regular, fill: 'hsl(var(--chart-1))' },
    { name: 'Atenção', value: classificationCounts.Atenção, fill: 'hsl(var(--chart-4))' },
    { name: 'Risco', value: classificationCounts.Risco, fill: 'hsl(var(--chart-5))' },
  ].filter((d) => d.value > 0)

  if (chartData.length === 0) {
    chartData.push(
      { name: 'Premium', value: 45, fill: '#10b981' },
      { name: 'Regular', value: 30, fill: '#3b82f6' },
      { name: 'Atenção', value: 15, fill: '#f59e0b' },
      { name: 'Risco', value: 10, fill: '#f43f5e' },
    )
  }

  const chartConfig = {
    Premium: { label: 'Premium', color: '#10b981' },
    Regular: { label: 'Regular', color: '#3b82f6' },
    Atenção: { label: 'Atenção', color: '#f59e0b' },
    Risco: { label: 'Risco', color: '#f43f5e' },
  }

  const atencaoClients = clientScores
    .filter((c) => c.classification === 'Atenção' || c.classification === 'Risco')
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)

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

  const handleImport = async () => {
    if (!importFile) return
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const { data, error } = await supabase.functions.invoke('parse-excel', {
        body: formData,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido')

      toast({
        title: 'Importação concluída',
        description: 'Os dados da planilha e módulos foram processados com sucesso.',
      })
      setIsImportOpen(false)
      setImportFile(null)
    } catch (err: any) {
      toast({
        title: 'Erro na importação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Geral
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão consolidada da saúde financeira e comercial.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="bg-white">
            <Upload className="h-4 w-4 mr-2" />
            Importar Planilha
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
            <CardTitle className="text-sm font-medium text-slate-600">Índice de Atenção</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{inadimplenciaPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">Da base exige acompanhamento</p>
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
            <CardTitle>Classificação da Carteira</CardTitle>
            <CardDescription>Distribuição dos clientes pelo Score Financeiro</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
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
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Atenção Imediata
            </CardTitle>
            <CardDescription>Clientes em risco ou com atrasos</CardDescription>
          </CardHeader>
          <CardContent>
            {atencaoClients.length > 0 ? (
              <div className="space-y-4">
                {atencaoClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">Score: {client.score}</p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        client.classification === 'Risco'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {client.classification}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                <ShieldCheck className="h-12 w-12 text-emerald-500 mb-3 opacity-20" />
                <p>Nenhum cliente em situação de risco no momento.</p>
              </div>
            )}
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
              {clients.slice(0, 5).map((client) => (
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
                      {formatCurrency(client.totalValue || client.valor_total || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {client.modules?.length || 0} Módulos
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

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Planilha de Clientes</DialogTitle>
            <DialogDescription>
              Faça o upload do seu arquivo Excel (.xlsx). O sistema lerá todas as abas, incluindo a
              aba "Módulos", e atualizará a base automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Arquivo Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? 'Processando...' : 'Importar Dados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
