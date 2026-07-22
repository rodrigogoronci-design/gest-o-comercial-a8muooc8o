import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CalendarRange,
  Search,
  FileSpreadsheet,
  Printer,
  Users,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClientesByAdesaoPeriodo,
  type ClienteAdesaoRelatorio,
} from '@/services/relatorio-adesao'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import logoUrl from '@/assets/logomarca-service-ea011.png'

function escapeCSVField(value: string | null | undefined): string {
  const safeValue = value ?? ''
  return `"${safeValue.replace(/"/g, '""')}"`
}

function downloadCSV(rows: ClienteAdesaoRelatorio[]) {
  const headers = [
    'Nome / Razão Social',
    'CNPJ',
    'Data de Adesão',
    'Status',
    'Mensalidade',
    'Modo de Implantação',
  ]
  const csvLines = [headers.map(escapeCSVField).join(';')]

  for (const row of rows) {
    csvLines.push(
      [
        row.nome,
        row.cnpj ? formatCNPJ(row.cnpj) : '',
        row.data_adesao ? formatDate(row.data_adesao) : '',
        row.status ?? '',
        row.valor_mensalidade != null ? formatCurrency(row.valor_mensalidade) : '',
        row.modo_implantacao ?? '-',
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
  link.download = `relatorio_adesao_clientes_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ClientAdhesionReport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<ClienteAdesaoRelatorio[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleGenerate = async () => {
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
      const data = await getClientesByAdesaoPeriodo(startDate, endDate)
      setClientes(data)
      setHasSearched(true)
      if (data.length === 0) {
        toast.info('Nenhum cliente encontrado para o período selecionado.')
      } else {
        toast.success(`${data.length} cliente(s) encontrado(s) no período.`)
      }
    } catch (error: any) {
      toast.error('Erro ao gerar relatório: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (clientes.length === 0) {
      toast.warning('Não há dados para exportar.')
      return
    }
    downloadCSV(clientes)
    toast.success('Relatório exportado com sucesso!')
  }

  const totalMensalidade = clientes.reduce((acc, c) => acc + (Number(c.valor_mensalidade) || 0), 0)

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="hidden print:flex items-center gap-8 border-b-2 border-slate-200 pb-3 mb-2">
        <img src={logoUrl} alt="Service Logic" className="h-12 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-[#1b4382]">Relatório de Adesão de Clientes</h1>
          <p className="text-[10pt] text-slate-600">
            Período: {startDate} a {endDate} | Gerado em {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      <Card className="shadow-sm print-card print:shadow-none print:border-none">
        <CardHeader className="no-print">
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-[#1b4382]" />
            Relatório de Adesão de Clientes
          </CardTitle>
          <CardDescription>
            Filtre clientes por data de adesão (assinatura) para analisar o crescimento da base em
            períodos específicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="print:p-0">
          <div className="flex flex-col gap-4 no-print">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
              <div className="flex-1 space-y-1.5">
                <Label
                  htmlFor="adesao-inicio"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
                >
                  <CalendarRange className="h-4 w-4 text-slate-400" />
                  Data Início
                </Label>
                <Input
                  id="adesao-inicio"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label
                  htmlFor="adesao-fim"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
                >
                  <CalendarRange className="h-4 w-4 text-slate-400" />
                  Data Fim
                </Label>
                <Input
                  id="adesao-fim"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleGenerate}
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
                    <Search className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>

            {startDate && endDate && new Date(endDate) < new Date(startDate) && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />A data fim não pode ser anterior à
                data de início.
              </div>
            )}

            {hasSearched && clientes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button onClick={handleExport} variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={() => window.print()} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <span className="text-sm text-slate-600 font-medium">
                  {clientes.length} cliente(s) | Mensalidade total:{' '}
                  {formatCurrency(totalMensalidade)}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 no-print">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Carregando clientes...</span>
            </div>
          ) : hasSearched && clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center no-print">
              <div className="rounded-full bg-slate-100 p-4 mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-medium text-slate-600">
                Nenhum cliente encontrado para o período selecionado
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Tente selecionar um intervalo de datas diferente.
              </p>
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 text-center no-print">
              <div className="rounded-full bg-slate-100 p-4 mb-4">
                <CalendarRange className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-medium text-slate-600">
                Selecione um período e clique em "Gerar Relatório"
              </p>
              <p className="text-sm text-slate-400 mt-1">
                O relatório filtra clientes pela data de assinatura (ou cadastro, se não houver).
              </p>
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
                      <TableHead className="min-w-[120px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Data de Adesão
                      </TableHead>
                      <TableHead className="min-w-[90px] text-center font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Status
                      </TableHead>
                      <TableHead className="min-w-[120px] text-right font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Mensalidade
                      </TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Modo de Implantação
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => {
                      const isInactive =
                        cliente.status === 'Inativo' || cliente.status === 'Cancelado'
                      return (
                        <TableRow
                          key={cliente.id}
                          className="hover:bg-slate-50/60 transition-colors print:hover:bg-transparent print:break-inside-avoid"
                        >
                          <TableCell className="font-medium text-slate-800 print:text-[8pt] print:py-1">
                            {cliente.nome}
                          </TableCell>
                          <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
                            {cliente.cnpj ? formatCNPJ(cliente.cnpj) : '—'}
                          </TableCell>
                          <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
                            {cliente.data_adesao ? formatDate(cliente.data_adesao) : '—'}
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
                          <TableCell className="text-right font-medium text-slate-800 print:text-[8pt] print:py-1">
                            {cliente.valor_mensalidade != null && cliente.valor_mensalidade > 0
                              ? formatCurrency(cliente.valor_mensalidade)
                              : cliente.valor_total != null && cliente.valor_total > 0
                                ? formatCurrency(cliente.valor_total)
                                : '—'}
                          </TableCell>
                          <TableCell className="text-slate-600 capitalize print:text-[8pt] print:py-1">
                            {cliente.modo_implantacao ?? '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 no-print">
                <span className="text-sm text-slate-500">
                  Total de <strong className="text-slate-700">{clientes.length}</strong> cliente(s)
                </span>
                <span className="text-sm text-slate-500">
                  Mensalidade total:{' '}
                  <strong className="text-slate-700">{formatCurrency(totalMensalidade)}</strong>
                </span>
              </div>
              <div className="hidden print:flex items-center justify-between px-4 py-2 border-t border-slate-300 text-[8pt] text-slate-600">
                <span>Total de {clientes.length} cliente(s)</span>
                <span>Mensalidade total: {formatCurrency(totalMensalidade)}</span>
              </div>
            </div>
          )}

          {hasSearched && clientes.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 no-print">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                A data de adesão utiliza primeiramente a data de assinatura do contrato. Para
                registros mais antigos sem data de assinatura, é utilizada a data de cadastro no
                sistema.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
