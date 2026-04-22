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
    if (rows.length < 2) throw new Error('Nenhum dado encontrado ou arquivo sem cabeçalhos.')

    const headers = rows[0].map((h: any) => String(h).toLowerCase())

    let cnpjIdx = headers.findIndex((h: string) => h.includes('cnpj') || h.includes('cpf'))
    let nomeIdx = headers.findIndex(
      (h: string) =>
        h.includes('razao') || h.includes('nome') || h.includes('cliente') || h.includes('pagador'),
    )
    let valorPagoIdx = headers.findIndex(
      (h: string) =>
        h.includes('pago') ||
        h.includes('recebido') ||
        h.includes('credito') ||
        (h.includes('valor') && !h.includes('titulo')),
    )
    let valorTituloIdx = headers.findIndex(
      (h: string) =>
        h.includes('titulo') ||
        h.includes('documento') ||
        h.includes('original') ||
        (h.includes('valor') && !h.includes('pago')),
    )
    let dataIdx = headers.findIndex((h: string) => h.includes('data') || h.includes('pagamento'))

    // Fallbacks to standard columns if headers are too weird
    if (cnpjIdx === -1) cnpjIdx = 0
    if (nomeIdx === -1) nomeIdx = 1
    if (valorTituloIdx === -1) valorTituloIdx = 2
    if (valorPagoIdx === -1) valorPagoIdx = 3
    if (dataIdx === -1) dataIdx = 4

    const { data: clients } = await supabase.from('clientes').select('id, nome, cnpj')
    const parsedRecords = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

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
        if (typeof val === 'number') return val
        // Handles PT-BR values: "1.500,00" -> "1500,00" -> "1500.00"
        const str = String(val || '0')
          .replace(/[^0-9,-]/g, '')
          .replace(',', '.')
        return parseFloat(str) || 0
      }

      const valorPago = parseNumber(row[valorPagoIdx])
      const valorTitulo = parseNumber(row[valorTituloIdx])

      let dataPagamento = new Date()
      const rawData = String(row[dataIdx])
      if (rawData.includes('/')) {
        const parts = rawData.split('/')
        if (parts.length === 3) {
          dataPagamento = new Date(
            `${parts[2].length === 2 ? '20' + parts[2] : parts[2]}-${parts[1]}-${parts[0]}T12:00:00`,
          )
        }
      } else if (!isNaN(Date.parse(rawData))) {
        dataPagamento = new Date(rawData)
      }
      if (isNaN(dataPagamento.getTime())) dataPagamento = new Date()

      parsedRecords.push({
        cliente_id: matchedClient?.id || null,
        razao_social: razaoSocial,
        cnpj: cnpj,
        valor_pago: valorPago,
        valor_titulo: valorTitulo,
        data_pagamento: dataPagamento.toISOString().split('T')[0],
        arquivo_origem: fileName,
      })
    }

    if (parsedRecords.length > 0) {
      const { error } = await supabase.from('recebimentos' as any).insert(parsedRecords)
      if (error) throw error
    } else {
      throw new Error('Nenhum dado válido para importação encontrado.')
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
