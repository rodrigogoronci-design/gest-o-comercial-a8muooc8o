import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, FileSpreadsheet, AlertCircle, Building2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { getClientesRelatorio, type ClienteRelatorio } from '@/services/relatorio-clientes'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import { parseModulosToList } from '@/lib/modules-parser'
import logoUrl from '@/assets/logomarca-service-ea011.png'

function escapeCSVField(value: string | null | undefined): string {
  const safeValue = value ?? ''
  return `"${safeValue.replace(/"/g, '""')}"`
}

function downloadCSV(rows: ClienteRelatorio[]) {
  const headers = [
    'Nome / Razão Social',
    'CNPJ',
    'Mensalidade',
    'Dia de Vencimento',
    'Plano Contratado',
    'Módulos',
    'Endereço',
    'Status',
  ]
  const csvLines = [headers.map(escapeCSVField).join(';')]

  for (const row of rows) {
    const modulos = parseModulosToList(row.modulos)
    csvLines.push(
      [
        row.nome,
        row.cnpj ? formatCNPJ(row.cnpj) : '',
        row.valor_total != null ? formatCurrency(row.valor_total) : '',
        row.vencimento_mensal != null ? String(row.vencimento_mensal) : '',
        row.plano_descricao ?? '',
        modulos.join(', '),
        row.endereco ?? '',
        row.status ?? '',
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
  link.download = `relatorio_clientes_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ClientReportTab() {
  const [clientes, setClientes] = useState<ClienteRelatorio[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClientesRelatorio()
      setClientes(data)
    } catch (error: any) {
      toast.error('Erro ao carregar relatório de clientes: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleExport = () => {
    if (clientes.length === 0) {
      toast.warning('Não há dados para exportar.')
      return
    }
    downloadCSV(clientes)
    toast.success('Relatório de clientes exportado com sucesso!')
  }

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="hidden print:flex items-center gap-8 border-b-2 border-slate-200 pb-3 mb-2">
        <img src={logoUrl} alt="Service Logic" className="h-12 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-[#1b4382]">Relatório de Clientes</h1>
          <p className="text-[10pt] text-slate-600">
            Documento gerado em {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      <Card className="shadow-sm print-card print:shadow-none print:border-none">
        <CardHeader className="no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#1b4382]" />
                Relatório de Clientes
              </CardTitle>
              <CardDescription className="mt-1">
                Visão consolidada de todos os clientes cadastrados com informações financeiras,
                contratuais e de identificação.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.print()} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={handleExport}
                disabled={loading || clientes.length === 0}
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 no-print">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Carregando clientes...</span>
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center no-print">
              <div className="rounded-full bg-slate-100 p-4 mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-medium text-slate-600">Nenhum cliente encontrado</p>
              <p className="text-sm text-slate-400 mt-1">
                Não há clientes cadastrados no sistema para exibir no relatório.
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
                      <TableHead className="min-w-[120px] text-right font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Mensalidade
                      </TableHead>
                      <TableHead className="min-w-[100px] text-center font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Vencimento
                      </TableHead>
                      <TableHead className="min-w-[150px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Plano
                      </TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Módulos
                      </TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-slate-700 print:hidden">
                        Endereço
                      </TableHead>
                      <TableHead className="min-w-[90px] text-center font-semibold text-slate-700 print:text-[8pt] print:py-1">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => {
                      const modulos = parseModulosToList(cliente.modulos)
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
                          <TableCell className="text-right font-medium text-slate-800 print:text-[8pt] print:py-1">
                            {cliente.valor_total != null && cliente.valor_total > 0
                              ? formatCurrency(cliente.valor_total)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-center text-slate-600 print:text-[8pt] print:py-1">
                            {cliente.vencimento_mensal != null
                              ? `${cliente.vencimento_mensal}º`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-slate-600 print:text-[8pt] print:py-1">
                            {cliente.plano_descricao ?? (
                              <span className="text-xs text-slate-400 italic">
                                Plano não informado
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="print:text-[8pt] print:py-1">
                            {modulos.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {modulos.map((modulo, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-white border-slate-200 text-slate-600 text-[10px] py-0 px-1.5 font-medium print:border-slate-300"
                                  >
                                    {modulo}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Nenhum módulo contratado
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600 max-w-[200px] truncate print:hidden">
                            {cliente.endereco || '—'}
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
              </div>
              <div className="hidden print:flex items-center justify-end px-4 py-2 border-t border-slate-300 text-[8pt] text-slate-600">
                Total de {clientes.length} cliente(s)
              </div>
            </div>
          )}

          {!loading && clientes.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 no-print">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Os dados são atualizados em tempo real. A mensalidade reflete o valor mensal
                contratado e o vencimento corresponde ao dia de pagamento recorrente.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
