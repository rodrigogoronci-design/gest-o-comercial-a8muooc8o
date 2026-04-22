import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Upload,
  Loader2,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

type Receipt = {
  id: string
  cliente_id: string | null
  razao_social: string
  cnpj: string
  valor_pago: number
  valor_titulo: number
  data_pagamento: string
  created_at: string
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const fetchReceipts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recebimentos')
      .select('*')
      .order('data_pagamento', { ascending: false })

    if (error) {
      console.error(error)
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' })
    } else {
      setReceipts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReceipts()
  }, [])

  const processExcelData = async (data: any, fileName: string) => {
    try {
      const sheets = Object.keys(data)
      if (sheets.length === 0) throw new Error('Arquivo vazio ou sem abas.')

      let rows: any[] = []
      for (const sheet of sheets) {
        if (Array.isArray(data[sheet])) {
          rows = rows.concat(data[sheet])
        }
      }

      if (rows.length < 1)
        throw new Error('Nenhum dado encontrado ou arquivo com formato inválido.')

      let headerRowIdx = -1
      let headers: string[] = []

      const normalizeStr = (s: any) =>
        String(s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()

      for (let i = 0; i < Math.min(rows.length, 50); i++) {
        const row = rows[i]
        if (!Array.isArray(row)) continue
        const rowStrs = row.map(normalizeStr)

        const matches = rowStrs.filter(
          (c) =>
            c.includes('cnpj') ||
            c.includes('cpf') ||
            c.includes('valor') ||
            c.includes('data') ||
            c.includes('nome') ||
            c.includes('cliente') ||
            c.includes('sacado') ||
            c.includes('pagador') ||
            c.includes('documento') ||
            c.includes('titulo') ||
            c.includes('vencimento') ||
            c.includes('historico') ||
            c.includes('razao') ||
            c.includes('fantasia') ||
            c.includes('descricao') ||
            c.includes('lancamento') ||
            c.includes('recebido'),
        ).length

        const strCount = row.filter(
          (c) => typeof c === 'string' && isNaN(Number(c)) && String(c).trim().length > 2,
        ).length

        if (matches >= 2 || (matches >= 1 && strCount >= 3)) {
          headerRowIdx = i
          headers = rowStrs
          break
        }
      }

      let cnpjIdx = -1,
        nomeIdx = -1,
        valorPagoIdx = -1,
        valorTituloIdx = -1,
        dataIdx = -1

      if (headerRowIdx !== -1) {
        cnpjIdx = headers.findIndex(
          (h) =>
            h.includes('cnpj') ||
            h.includes('cpf') ||
            h.includes('documento') ||
            h.includes('inscricao'),
        )
        nomeIdx = headers.findIndex(
          (h) =>
            h.includes('razao') ||
            h.includes('nome') ||
            h.includes('cliente') ||
            h.includes('pagador') ||
            h.includes('sacado') ||
            h.includes('empresa') ||
            h.includes('historico') ||
            h.includes('fantasia') ||
            h.includes('descricao'),
        )
        valorPagoIdx = headers.findIndex(
          (h) =>
            h.includes('pago') ||
            h.includes('recebido') ||
            h.includes('credito') ||
            h.includes('liquido') ||
            h.includes('baixa') ||
            h.includes('vlr. pago') ||
            h.includes('valor pago'),
        )
        valorTituloIdx = headers.findIndex(
          (h) =>
            h.includes('titulo') ||
            h.includes('original') ||
            h.includes('bruto') ||
            h.includes('nominal') ||
            h.includes('valor doc') ||
            h.includes('vlr'),
        )
        dataIdx = headers.findIndex(
          (h) =>
            h.includes('data') ||
            h.includes('pagamento') ||
            h.includes('vencimento') ||
            h.includes('dt.') ||
            h.includes('baixa') ||
            h.includes('lancamento'),
        )

        if (valorPagoIdx === -1) {
          valorPagoIdx = headers.findIndex(
            (h) => h.includes('valor') && !h.includes('titulo') && !h.includes('doc'),
          )
        }
        if (valorTituloIdx === -1 && valorPagoIdx !== -1) {
          valorTituloIdx = headers.findIndex(
            (h) => h.includes('valor') && h !== headers[valorPagoIdx],
          )
        }
        if (valorTituloIdx === -1) valorTituloIdx = valorPagoIdx
      }

      const { data: initialClients } = await supabase.from('clientes').select('id, nome, cnpj')
      let clientsList = initialClients || []

      const parsedRows = []
      const missingClientsMap = new Map()

      const parseNumber = (val: any) => {
        if (val === null || val === undefined || val === '') return 0
        if (typeof val === 'number') return val
        let str = String(val)
          .trim()
          .replace(/[R$\s]/g, '')
          .replace(/\xA0/g, '')
        const lastComma = str.lastIndexOf(',')
        const lastDot = str.lastIndexOf('.')
        if (lastComma > lastDot) {
          str = str.replace(/\./g, '').replace(',', '.')
        } else if (lastDot > lastComma && lastComma !== -1) {
          str = str.replace(/,/g, '')
        } else if (lastComma !== -1) {
          str = str.replace(',', '.')
        }
        const num = parseFloat(str)
        return isNaN(num) ? 0 : Math.abs(num)
      }

      const parseDate = (val: any) => {
        if (!val) return null
        if (val instanceof Date) return isNaN(val.getTime()) ? null : val
        const str = String(val).trim()
        if (!str) return null

        const ptBrDateMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
        if (ptBrDateMatch) {
          let d = parseInt(ptBrDateMatch[1])
          let m = parseInt(ptBrDateMatch[2])
          let y = parseInt(ptBrDateMatch[3])
          if (y < 100) y += 2000
          const date = new Date(y, m - 1, d, 12, 0, 0)
          if (!isNaN(date.getTime())) return date
        }

        if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
          const d = new Date(str)
          if (!isNaN(d.getTime())) return d
        }

        const num = parseFloat(str)
        if (!isNaN(num) && num > 10000 && num < 100000) {
          return new Date((num - 25569) * 86400 * 1000)
        }

        const fallback = new Date(str)
        return isNaN(fallback.getTime()) ? null : fallback
      }

      const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i]
        if (!Array.isArray(row) || row.length === 0) continue

        let rawCnpj = ''
        let rawNome = ''
        let valorPago = 0
        let valorTitulo = 0
        let dataPagamento: Date | null = null

        if (cnpjIdx !== -1) rawCnpj = String(row[cnpjIdx] || '').replace(/\D/g, '')
        if (nomeIdx !== -1) rawNome = String(row[nomeIdx] || '').trim()
        if (valorPagoIdx !== -1) valorPago = parseNumber(row[valorPagoIdx])
        if (valorTituloIdx !== -1) valorTitulo = parseNumber(row[valorTituloIdx])
        if (dataIdx !== -1) dataPagamento = parseDate(row[dataIdx])

        if (!dataPagamento) {
          for (let c of row) {
            const d = parseDate(c)
            if (d && d.getFullYear() > 2000 && d.getFullYear() <= new Date().getFullYear() + 2) {
              dataPagamento = d
              break
            }
          }
        }

        if (!dataPagamento) continue

        if (valorPago === 0) {
          const nums = row.map(parseNumber).filter((n) => n > 0 && n < 10000000)
          if (nums.length > 0) {
            valorPago = nums[nums.length - 1]
          }
        }
        if (valorTitulo === 0) {
          valorTitulo = valorPago
        }

        if (valorPago === 0) continue

        if (!rawCnpj) {
          const cnpjs = row
            .map((c) => String(c).replace(/\D/g, ''))
            .filter((c) => c.length === 11 || c.length === 14)
          if (cnpjs.length > 0) rawCnpj = cnpjs[0]
        }

        if (!rawNome) {
          const strs = row.filter(
            (c) =>
              typeof c === 'string' &&
              isNaN(Number(c)) &&
              !parseDate(c) &&
              String(c).trim().length > 3 &&
              !String(c).match(/^\d+$/) &&
              !headers.includes(normalizeStr(c)),
          )
          if (strs.length > 0) {
            const sorted = strs.sort((a, b) => String(b).length - String(a).length)
            rawNome = String(sorted[0]).trim()
          }
        }

        if (
          !rawNome ||
          normalizeStr(rawNome).includes('total') ||
          normalizeStr(rawNome).includes('saldo')
        ) {
          rawNome = 'Cliente não identificado'
        }

        if (!isNaN(Number(rawNome)) && rawNome !== 'Cliente não identificado') {
          rawNome = 'Cliente não identificado'
        }

        parsedRows.push({
          rawCnpj,
          rawNome,
          valorPago,
          valorTitulo,
          dataPagamento,
          originalRow: row,
        })

        let matchedClient = clientsList.find((c) => {
          const cCnpj = String(c.cnpj || '').replace(/\D/g, '')
          return cCnpj && rawCnpj && cCnpj === rawCnpj
        })

        if (!matchedClient && rawNome && rawNome !== 'Cliente não identificado') {
          matchedClient = clientsList.find((c) => c.nome.toLowerCase() === rawNome.toLowerCase())
        }

        if (!matchedClient && rawNome && rawNome !== 'Cliente não identificado') {
          const cleanCnpj = rawCnpj || '00000000000000'
          const key = cleanCnpj !== '00000000000000' ? cleanCnpj : rawNome.toLowerCase()

          if (!missingClientsMap.has(key)) {
            missingClientsMap.set(key, {
              nome: String(rawNome).substring(0, 255),
              cnpj: String(cleanCnpj).substring(0, 20),
              status: 'Ativo',
            })
          }
        }
      }

      if (parsedRows.length === 0) {
        throw new Error(
          'Nenhum pagamento válido encontrado. Verifique se o arquivo possui as colunas de Valor e Data preenchidas.',
        )
      }

      if (missingClientsMap.size > 0) {
        const clientsToInsert = Array.from(missingClientsMap.values())
        const { data: newClients, error: insertError } = await supabase
          .from('clientes')
          .insert(clientsToInsert)
          .select('id, nome, cnpj')

        if (!insertError && newClients) {
          clientsList = [...clientsList, ...newClients]
        } else if (insertError) {
          console.warn('Failed to bulk insert missing clients:', insertError.message)
        }
      }

      const parsedRecords = []

      for (const row of parsedRows) {
        let matchedClient = clientsList.find((c) => {
          const cCnpj = String(c.cnpj || '').replace(/\D/g, '')
          return cCnpj && row.rawCnpj && cCnpj === row.rawCnpj
        })

        if (!matchedClient && row.rawNome && row.rawNome !== 'Cliente não identificado') {
          matchedClient = clientsList.find(
            (c) =>
              c.nome.toLowerCase() === row.rawNome.toLowerCase() ||
              (row.rawNome.length > 5 && c.nome.toLowerCase().includes(row.rawNome.toLowerCase())),
          )
        }

        const razaoSocial = String(matchedClient?.nome || row.rawNome || 'Cliente não identificado')
        const cnpj = String(matchedClient?.cnpj || row.rawCnpj || '')

        parsedRecords.push({
          cliente_id: matchedClient?.id || null,
          razao_social: razaoSocial.substring(0, 255),
          cnpj: cnpj.substring(0, 20),
          valor_pago: row.valorPago,
          valor_titulo: row.valorTitulo,
          data_pagamento: row.dataPagamento.toISOString().split('T')[0],
          arquivo_origem: fileName,
        })
      }

      if (parsedRecords.length > 0) {
        const batchSize = 100
        for (let i = 0; i < parsedRecords.length; i += batchSize) {
          const batch = parsedRecords.slice(i, i + batchSize)
          const { error } = await supabase.from('recebimentos').insert(batch)
          if (error) throw new Error(`Falha ao inserir dados no banco: ${error.message}`)
        }
      } else {
        throw new Error(
          'Nenhum dado válido para importação encontrado. Verifique se o arquivo possui valores preenchidos.',
        )
      }
    } catch (e: any) {
      console.error('Error inside processExcelData:', e)
      throw e
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'parse-excel',
        {
          body: formData,
        },
      )

      if (uploadError) throw new Error(uploadError.message)

      let parsedData = uploadData
      if (typeof uploadData === 'string') {
        try {
          parsedData = JSON.parse(uploadData)
        } catch (e) {
          // ignore parsing error
        }
      }

      if (parsedData?.error) throw new Error(parsedData.error)
      if (!parsedData?.data) throw new Error('Resposta inválida do servidor ao ler o arquivo.')

      await processExcelData(parsedData.data, file.name)

      toast({ title: 'Sucesso', description: 'Arquivo importado e processado com sucesso.' })
      await fetchReceipts()
    } catch (error: any) {
      console.error(error)
      toast({ title: 'Erro na importação', description: error.message, variant: 'destructive' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredReceipts = receipts.filter(
    (r) =>
      r.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cnpj?.includes(searchTerm),
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy')
    } catch {
      return dateStr
    }
  }

  const chartData = useMemo(() => {
    const grouped = receipts.reduce(
      (acc, r) => {
        if (!r.data_pagamento) return acc
        const month = r.data_pagamento.substring(0, 7)
        if (!acc[month]) acc[month] = { month, recebido: 0, previsto: 0 }
        acc[month].recebido += Number(r.valor_pago) || 0
        acc[month].previsto += Number(r.valor_titulo) || 0
        return acc
      },
      {} as Record<string, { month: string; recebido: number; previsto: number }>,
    )

    return Object.values(grouped)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
  }, [receipts])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acompanhamento de Recebimentos</h1>
          <p className="text-muted-foreground mt-1">
            Importe o arquivo de retorno bancário e visualize os pagamentos mensais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? 'Processando...' : 'Importar Arquivo'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Lista de Recebimentos
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Métricas e Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0 focus-visible:outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Recebimentos</CardTitle>
              <CardDescription>
                Histórico de pagamentos identificados a partir dos arquivos de retorno.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente ou CNPJ..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente (Razão Social)</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-right">Valor do Título</TableHead>
                      <TableHead className="text-right">Valor Pago</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredReceipts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum recebimento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReceipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell className="font-medium">
                            {formatDate(receipt.data_pagamento)}
                          </TableCell>
                          <TableCell>{receipt.razao_social}</TableCell>
                          <TableCell>{receipt.cnpj}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(receipt.valor_titulo)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600">
                            {formatCurrency(receipt.valor_pago)}
                          </TableCell>
                          <TableCell>
                            {!receipt.cliente_id ? (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-200 bg-amber-50 whitespace-nowrap"
                              >
                                <HelpCircle className="w-3 h-3 mr-1" /> Não Identificado
                              </Badge>
                            ) : receipt.valor_pago < receipt.valor_titulo ? (
                              <Badge
                                variant="outline"
                                className="text-rose-600 border-rose-200 bg-rose-50 whitespace-nowrap"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" /> Divergência
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 bg-emerald-50 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Conciliado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-0 focus-visible:outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
              <CardDescription>
                Comparativo entre valor previsto (títulos) e valor efetivamente pago nos últimos 6
                meses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                  <p>Nenhum dado suficiente para gerar gráficos.</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    recebido: { label: 'Recebido', color: 'hsl(var(--primary))' },
                    previsto: { label: 'Previsto', color: 'hsl(var(--muted-foreground))' },
                  }}
                  className="h-[400px] w-full mt-4"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(v) => {
                          if (!v) return ''
                          const [y, m] = v.split('-')
                          return `${m}/${y}`
                        }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tickFormatter={(v) => `R$ ${(v / 1000).toFixed(1)}k`}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="previsto"
                        fill="var(--color-previsto)"
                        radius={[4, 4, 0, 0]}
                        opacity={0.3}
                      />
                      <Bar dataKey="recebido" fill="var(--color-recebido)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
