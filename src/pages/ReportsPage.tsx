import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [faturamentoData, setFaturamentoData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // MOCK DATA for Faturamento (Aggregation from backend would require complex queries or views)
      const mockFaturamento = [
        { name: 'Jan', fixo: 4000, aditivo: 2400 },
        { name: 'Fev', fixo: 3000, aditivo: 1398 },
        { name: 'Mar', fixo: 2000, aditivo: 9800 },
        { name: 'Abr', fixo: 2780, aditivo: 3908 },
        { name: 'Mai', fixo: 1890, aditivo: 4800 },
        { name: 'Jun', fixo: 2390, aditivo: 3800 },
      ]
      setFaturamentoData(mockFaturamento)

      const mockPerformance = [
        { tecnico: 'João Silva', tempoMedio: 2.5, visitas: 15 },
        { tecnico: 'Maria Souza', tempoMedio: 1.8, visitas: 22 },
        { tecnico: 'Carlos Santos', tempoMedio: 3.1, visitas: 10 },
        { tecnico: 'Ana Oliveira', tempoMedio: 2.0, visitas: 18 },
      ]
      setPerformanceData(mockPerformance)
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Falha ao carregar relatórios', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    toast({ title: 'Sucesso', description: 'Relatório exportado para CSV com sucesso.' })
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios e Dashboards</h2>
          <p className="text-muted-foreground mt-1">
            Visualize o desempenho comercial e operacional.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar Dados
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Faturamento Mensal</CardTitle>
            <CardDescription>Receita de contratos fixos vs. aditivos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <ChartContainer
                config={{
                  fixo: { label: 'Contratos Fixos', color: 'hsl(var(--primary))' },
                  aditivo: { label: 'Aditivos', color: 'hsl(var(--chart-2))' },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={faturamentoData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="fixo"
                      fill="var(--color-fixo)"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="aditivo"
                      fill="var(--color-aditivo)"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Performance de Execução</CardTitle>
            <CardDescription>
              Tempo médio (em dias) para execução de visitas técnicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <ChartContainer
                config={{
                  tempoMedio: { label: 'Tempo Médio (Dias)', color: 'hsl(var(--chart-3))' },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="tecnico"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="tempoMedio"
                      stroke="var(--color-tempoMedio)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
