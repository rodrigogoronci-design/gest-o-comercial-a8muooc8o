import { useState, useEffect, useRef } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { Upload, Loader2, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'

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
      .from('recebimentos' as any)
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
    const sheets = Object.keys(data)
    if (sheets.length === 0) throw new Error('Arquivo vazio.')
    const rows = data[sheets[0]]
    if (!Array.isArray(rows) || rows.length < 2)
      throw new Error('Nenhum dado encontrado ou arquivo com formato inválido.')

    let headerRowIdx = -1
    let headers: string[] = []
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i]
      if (!Array.isArray(row)) continue
      const rowStrs = row.map((c) => String(c || '').toLowerCase())
      if (
        rowStrs.some(
          (c) =>
            c.includes('cnpj') ||
            c.includes('cpf') ||
            c.includes('valor') ||
            c.includes('data') ||
            c.includes('nome') ||
            c.includes('cliente'),
        )
      ) {
        headerRowIdx = i
        headers = rowStrs
        break
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0
      headers = (rows[0] || []).map((c: any) => String(c || '').toLowerCase())
    }

    let cnpjIdx = headers.findIndex((h) => h.includes('cnpj') || h.includes('cpf'))
    let nomeIdx = headers.findIndex(
      (h) =>
        h.includes('razao') ||
        h.includes('nome') ||
        h.includes('cliente') ||
        h.includes('pagador') ||
        h.includes('sacado'),
    )
    let valorPagoIdx = headers.findIndex(
      (h) =>
        h.includes('pago') ||
        h.includes('recebido') ||
        h.includes('credito') ||
        h.includes('líquido') ||
        h.includes('liquido'),
    )
    let valorTituloIdx = headers.findIndex(
      (h) =>
        h.includes('titulo') ||
        h.includes('documento') ||
        h.includes('original') ||
        h.includes('bruto'),
    )
    let dataIdx = headers.findIndex(
      (h) => h.includes('data') || h.includes('pagamento') || h.includes('vencimento'),
    )

    if (cnpjIdx === -1) cnpjIdx = 0
    if (nomeIdx === -1) nomeIdx = 1

    if (valorPagoIdx === -1) {
      valorPagoIdx = headers.findIndex((h) => h.includes('valor'))
      if (valorPagoIdx === -1) valorPagoIdx = 3
    }
    if (valorTituloIdx === -1) {
      valorTituloIdx = headers.findIndex((h) => h.includes('valor') && h !== headers[valorPagoIdx])
      if (valorTituloIdx === -1) valorTituloIdx = 2
    }
    if (valorTituloIdx === valorPagoIdx) {
      valorTituloIdx = 2
      valorPagoIdx = 3
    }
    if (dataIdx === -1) dataIdx = 4

    const { data: clients } = await supabase.from('clientes').select('id, nome, cnpj')
    const parsedRecords = []

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!Array.isArray(row) || row.length === 0) continue

      const rawCnpj = String(row[cnpjIdx] || '').replace(/\D/g, '')
      const rawNome = String(row[nomeIdx] || '').trim()

      if (!rawCnpj && !rawNome) continue

      let matchedClient = clients?.find((c) => c.cnpj.replace(/\D/g, '') === rawCnpj)
      if (!matchedClient && rawNome) {
        matchedClient = clients?.find((c) => c.nome.toLowerCase().includes(rawNome.toLowerCase()))
      }

      const razaoSocial = matchedClient?.nome || rawNome || 'Cliente não identificado'
      const cnpj = matchedClient?.cnpj || row[cnpjIdx] || rawCnpj || ''

      const parseNumber = (val: any) => {
        if (val === null || val === undefined || val === '') return 0
        if (typeof val === 'number') return val
        let str = String(val)
          .trim()
          .replace(/[R$\s]/g, '')
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
        return isNaN(num) ? 0 : num
      }

      const parseDate = (val: any) => {
        if (!val) return new Date()
        const str = String(val).trim()
        if (str.includes('T')) {
          const d = new Date(str)
          if (!isNaN(d.getTime())) return d
        }
        const parts = str.split(/[/.-]/)
        if (parts.length === 3) {
          let d, m, y
          if (parts[0].length === 4) {
            y = parseInt(parts[0])
            m = parseInt(parts[1])
            d = parseInt(parts[2])
          } else {
            d = parseInt(parts[0])
            m = parseInt(parts[1])
            y = parseInt(parts[2])
            if (y < 100) y += 2000
          }
          const date = new Date(y, m - 1, d, 12, 0, 0)
          if (!isNaN(date.getTime())) return date
        }
        const num = parseFloat(str)
        if (!isNaN(num) && num > 10000 && num < 100000) {
          return new Date((num - 25569) * 86400 * 1000)
        }
        const fallback = new Date(str)
        return isNaN(fallback.getTime()) ? new Date() : fallback
      }

      const valorPago = parseNumber(row[valorPagoIdx])
      const valorTitulo = parseNumber(row[valorTituloIdx])
      const dataPagamento = parseDate(row[dataIdx])

      if (!razaoSocial || (razaoSocial === 'Cliente não identificado' && valorPago === 0)) continue

      parsedRecords.push({
        cliente_id: matchedClient?.id || null,
        razao_social: razaoSocial.substring(0, 255),
        cnpj: cnpj.substring(0, 20),
        valor_pago: valorPago,
        valor_titulo: valorTitulo,
        data_pagamento: dataPagamento.toISOString().split('T')[0],
        arquivo_origem: fileName,
      })
    }

    if (parsedRecords.length > 0) {
      const batchSize = 100
      for (let i = 0; i < parsedRecords.length; i += batchSize) {
        const batch = parsedRecords.slice(i, i + batchSize)
        const { error } = await supabase.from('recebimentos' as any).insert(batch)
        if (error) throw new Error(`Falha ao inserir dados no banco: ${error.message}`)
      }
    } else {
      throw new Error(
        'Nenhum dado válido para importação encontrado. Verifique o formato das colunas do arquivo.',
      )
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
      if (uploadData?.error) throw new Error(uploadData.error)

      await processExcelData(uploadData.data, file.name)

      toast({ title: 'Sucesso', description: 'Arquivo importado e processado com sucesso.' })
      fetchReceipts()
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
      r.cnpj.includes(searchTerm),
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
