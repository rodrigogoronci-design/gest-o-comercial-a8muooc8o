import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { createAtividadesBatch } from '@/services/atividades'
import { Loader2, ArrowRight, FileSpreadsheet } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

const DB_FIELDS = [
  { key: 'data_atividade', label: 'Data da Atividade', req: true },
  { key: 'cliente_nome', label: 'Cliente/Empresa' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'acao_necessaria', label: 'Ação Necessária' },
  { key: 'status', label: 'Status' },
  { key: 'demanda', label: 'Demanda', req: true },
  { key: 'data_follow_up', label: 'Data Follow-up' },
  { key: 'observacoes', label: 'Observações' },
  { key: 'valor_mensalidade', label: 'Valor Mensalidade' },
  { key: 'valor_implantacao', label: 'Valor Implantação' },
  { key: 'condicao', label: 'Condição de Pagto' },
  { key: 'parcelas', label: 'Parcelas' },
]

export function ImportActivitiesDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const parseFile = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data, error } = await supabase.functions.invoke('parse-excel', { body: formData })
      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Erro ao processar')

      const sheets = Object.keys(data.data)
      if (!sheets.length) throw new Error('Planilha vazia')

      const sheetData = data.data[sheets[0]]
      if (sheetData.length < 2) throw new Error('Planilha sem dados suficientes')

      const extHeaders = sheetData[0] || []
      setHeaders(extHeaders)
      setRows(sheetData.slice(1).filter((r: any[]) => r.some((c: any) => c)))

      const autoMap: Record<string, string> = {}
      DB_FIELDS.forEach((f) => {
        const lbl = f.label.toLowerCase()
        const idx = extHeaders.findIndex(
          (h: string) =>
            h &&
            (h.toLowerCase().includes(lbl.split(' ')[0]) ||
              lbl.includes(h.toLowerCase().split(' ')[0])),
        )
        if (idx !== -1) autoMap[f.key] = idx.toString()
      })

      const dIdx = extHeaders.findIndex((h: string) => h?.toLowerCase() === 'data')
      if (dIdx !== -1) autoMap['data_atividade'] = dIdx.toString()

      const followIdx = extHeaders.findIndex((h: string) => h?.toLowerCase().includes('follow'))
      if (followIdx !== -1) autoMap['data_follow_up'] = followIdx.toString()

      setMapping(autoMap)
      setStep(2)
    } catch (error: any) {
      toast({ title: 'Erro ao ler arquivo', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const toInsert = rows.map((row) => {
        const ativ: any = {}
        DB_FIELDS.forEach((f) => {
          const colIdx = mapping[f.key]
          if (colIdx) {
            let val = row[parseInt(colIdx)]
            if (f.key === 'data_atividade' || f.key === 'data_follow_up') {
              if (val && typeof val === 'string' && val.includes('/')) {
                const p = val.split('/')
                val = p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : val
              } else if (val && typeof val === 'string' && val.includes('T')) {
                val = val.split('T')[0]
              }
              ativ[f.key] = val || null
            } else if (f.key === 'valor_mensalidade' || f.key === 'valor_implantacao') {
              const num =
                typeof val === 'number'
                  ? val
                  : parseFloat(
                      String(val || '')
                        .replace(/[R$\s]/g, '')
                        .replace(/\./g, '')
                        .replace(',', '.'),
                    )
              ativ[f.key] = isNaN(num) ? null : num
            } else {
              ativ[f.key] = val ? String(val) : null
            }
          }
        })
        if (!ativ.data_atividade) ativ.data_atividade = new Date().toISOString().split('T')[0]
        if (!ativ.demanda) ativ.demanda = 'Importado da planilha'
        return ativ
      })

      await createAtividadesBatch(toInsert)
      toast({ title: 'Sucesso', description: `${toInsert.length} registros importados.` })

      setOpen(false)
      onImported()
      setTimeout(() => {
        setStep(1)
        setFile(null)
        setHeaders([])
        setRows([])
        setMapping({})
      }, 300)
    } catch (err: any) {
      toast({ title: 'Erro ao importar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 size-4" /> Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Diário</DialogTitle>
        </DialogHeader>
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="grid w-full max-w-sm gap-1.5">
              <Label>Selecione o arquivo Excel ou CSV</Label>
              <Input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={parseFile} disabled={!file || loading}>
                {loading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="size-4 mr-2" />
                )}
                Continuar
              </Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <p className="text-sm text-gray-500 mb-4">
              Mapeie as colunas ({rows.length} registros).
            </p>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo no Sistema</TableHead>
                    <TableHead>Coluna na Planilha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DB_FIELDS.map((f) => (
                    <TableRow key={f.key}>
                      <TableCell className="font-medium">
                        {f.label} {f.req && <span className="text-red-500">*</span>}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping[f.key] || ''}
                          onValueChange={(v) => setMapping((p) => ({ ...p, [f.key]: v }))}
                        >
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Ignorar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Ignorar --</SelectItem>
                            {headers.map((h, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {h || `Coluna ${i + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />} Importar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
