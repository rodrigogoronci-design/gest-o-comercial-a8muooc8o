import { useEffect, useState } from 'react'
import { getAtividades, deleteAtividade, Atividade } from '@/services/atividades'
import { ActivityDialog } from '@/components/activities/ActivityDialog'
import { ImportActivitiesDialog } from '@/components/activities/ImportActivitiesDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, Trash2, ListTodo, Pencil } from 'lucide-react'
import { EditActivityDialog } from '@/components/activities/EditActivityDialog'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'
  const parts = dateString.split('T')[0].split('-')
  if (parts.length !== 3) return dateString
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export default function ActivitiesPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [loading, setLoading] = useState(true)
  const [editingActivity, setEditingActivity] = useState<Atividade | null>(null)
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
    const headers = [
      'Data',
      'Cliente',
      'Tipo',
      'Ação Necessária',
      'Status',
      'Demanda',
      'Data Follow-up',
      'Observações',
      'Valor Mensalidade',
      'Valor Implantação',
      'Condição',
      'Parcelas',
    ]
    const rows = atividades.map((a) => [
      formatDate(a.data_atividade),
      `"${a.clientes?.nome || a.cliente_nome || '-'}"`,
      `"${a.tipo || '-'}"`,
      `"${a.acao_necessaria || '-'}"`,
      `"${a.status || '-'}"`,
      `"${(a.demanda || '').replace(/"/g, '""')}"`,
      formatDate(a.data_follow_up),
      `"${(a.observacoes || '').replace(/"/g, '""')}"`,
      a.valor_mensalidade || 0,
      a.valor_implantacao || 0,
      `"${a.condicao || '-'}"`,
      `"${a.parcelas || '-'}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_atividades_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ListTodo className="size-8 text-indigo-600" />
            Diário de Atividades
          </h1>
          <p className="text-gray-500 mt-1">
            Controle diário, importação de planilhas e relatórios de interações comerciais.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={atividades.length === 0}>
            <Download className="mr-2 size-4" /> Exportar Relatório
          </Button>
          <ImportActivitiesDialog onImported={loadData} />
          <ActivityDialog onSaved={loadData} />
        </div>
      </div>

      <EditActivityDialog
        atividade={editingActivity}
        open={!!editingActivity}
        onOpenChange={(open) => !open && setEditingActivity(null)}
        onSaved={() => {
          setEditingActivity(null)
          loadData()
        }}
      />

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
              <p>Importe sua planilha ou clique em "Nova Atividade".</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[180px]">Cliente</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[250px]">Demanda / Observações</TableHead>
                    <TableHead className="w-[110px]">Follow-up</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atividades.map((atividade) => (
                    <TableRow key={atividade.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(atividade.data_atividade)}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {atividade.clientes?.nome || atividade.cliente_nome || '-'}
                      </TableCell>
                      <TableCell>
                        {atividade.tipo ? (
                          <Badge variant="outline" className="bg-gray-50">
                            {atividade.tipo}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {atividade.status ? (
                          <Badge variant="secondary">{atividade.status}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-900 line-clamp-2" title={atividade.demanda}>
                          {atividade.demanda}
                        </div>
                        {atividade.observacoes && (
                          <div
                            className="text-xs text-gray-500 mt-1 line-clamp-1"
                            title={atividade.observacoes}
                          >
                            Obs: {atividade.observacoes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap">
                        {formatDate(atividade.data_follow_up)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setEditingActivity(atividade)}
                            title="Editar atividade"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(atividade.id)}
                            title="Excluir atividade"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
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
