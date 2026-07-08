import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileSpreadsheet, CalendarRange, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getAtendimentosWithClientes, type AtendimentoWithCliente } from '@/services/atendimentos'
import { formatCurrency } from '@/lib/formatters'

function escapeCSVField(value: string | null | undefined): string {
  const safeValue = value ?? ''
  const escaped = safeValue.replace(/"/g, '""')
  return `"${escaped}"`
}

function formatDateForCSV(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR')
}

function downloadCSV(rows: AtendimentoWithCliente[]) {
  const headers = ['Nome do Cliente', 'CNPJ', 'Data do Atendimento', 'Assunto', 'Detalhamento']
  const csvLines = [headers.map(escapeCSVField).join(';')]

  for (const row of rows) {
    const clienteNome = row.clientes?.nome ?? ''
    const clienteCnpj = row.clientes?.cnpj ?? ''
    const dataAtendimento = formatDateForCSV(row.data_atendimento)
    const solicitacao = row.solicitacao ?? ''
    const relatorio = row.relatorio ?? ''
    csvLines.push(
      [clienteNome, clienteCnpj, dataAtendimento, solicitacao, relatorio]
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
  link.download = `relatorio_atendimentos_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function GeneralAtendimentosReport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultCount, setResultCount] = useState<number | null>(null)

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.warning('Selecione as datas de início e fim para gerar o relatório.')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('A data fim não pode ser anterior à data de início.')
      return
    }

    setLoading(true)
    try {
      const data = await getAtendimentosWithClientes(startDate, endDate)
      setResultCount(data.length)

      if (data.length === 0) {
        toast.info('Nenhum atendimento encontrado para o período selecionado.')
        return
      }

      downloadCSV(data)
      toast.success(`${data.length} atendimento(s) exportado(s) com sucesso!`)
    } catch (error: any) {
      toast.error('Erro ao gerar relatório: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-[#1b4382]" />
          Relatório Geral de Atendimentos
        </CardTitle>
        <CardDescription>
          Selecione um período para exportar todos os atendimentos em formato de planilha (CSV),
          incluindo dados do cliente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label
                htmlFor="data-inicio"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
              >
                <CalendarRange className="h-4 w-4 text-slate-400" />
                Data Início
              </Label>
              <Input
                id="data-inicio"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label
                htmlFor="data-fim"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
              >
                <CalendarRange className="h-4 w-4 text-slate-400" />
                Data Fim
              </Label>
              <Input
                id="data-fim"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={handleExport}
              disabled={loading || !startDate || !endDate}
              className="bg-[#1b4382] hover:bg-[#1b4382]/90 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Planilha
                </>
              )}
            </Button>
            {resultCount !== null && !loading && resultCount > 0 && (
              <span className="text-sm text-slate-600 font-medium">
                {resultCount} registro(s) encontrado(s) no período
              </span>
            )}
          </div>

          {startDate && endDate && new Date(endDate) < new Date(startDate) && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />A data fim não pode ser anterior à
              data de início.
            </div>
          )}

          <div className="mt-2 border-t border-slate-100 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Colunas da planilha:</h4>
            <ul className="text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-1">
              <li>• Nome do Cliente</li>
              <li>• CNPJ</li>
              <li>• Data do Atendimento</li>
              <li>• Assunto (solicitação)</li>
              <li>• Detalhamento (relatório)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
