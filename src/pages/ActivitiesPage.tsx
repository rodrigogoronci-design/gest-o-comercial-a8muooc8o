import { useEffect, useState } from 'react'
import { getAtividades, deleteAtividade, Atividade } from '@/services/atividades'
import { ActivityDialog } from '@/components/activities/ActivityDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, Trash2, ListTodo } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export default function ActivitiesPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getAtividades()
      setAtividades(data)
    } catch (error: any) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return
    try {
      await deleteAtividade(id)
      toast({ title: 'Registro excluído com sucesso' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    }
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Cliente', 'Demanda']
    const rows = atividades.map((a) => [
      formatDate(a.data_atividade),
      `"${a.clientes?.nome || '-'}"`,
      `"${a.demanda.replace(/"/g, '""')}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_atividades_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ListTodo className="size-8 text-indigo-600" />
            Diário de Atividades
          </h1>
          <p className="text-gray-500 mt-1">
            Controle diário e relatórios mensais de interações comerciais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={atividades.length === 0}>
            <Download className="mr-2 size-4" /> Exportar Relatório
          </Button>
          <ActivityDialog onSaved={loadData} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Demandas</CardTitle>
          <CardDescription>
            Acompanhe todas as interações realizadas com os clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : atividades.length === 0 ? (
            <div className="text-center p-12 text-gray-500 border rounded-lg border-dashed bg-gray-50/50">
              <ListTodo className="size-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-900">Nenhuma atividade registrada</p>
              <p>Clique em "Nova Atividade" para iniciar seu diário.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[250px]">Cliente</TableHead>
                    <TableHead>Demanda</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atividades.map((atividade) => (
                    <TableRow key={atividade.id}>
                      <TableCell className="font-medium">
                        {formatDate(atividade.data_atividade)}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {atividade.clientes?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 whitespace-pre-wrap">
                        {atividade.demanda}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(atividade.id)}
                          title="Excluir atividade"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
