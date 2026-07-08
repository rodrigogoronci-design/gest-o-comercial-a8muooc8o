import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Printer, FileSearch, Users } from 'lucide-react'
import { AtendimentoReportDocument } from '@/components/AtendimentoReportDocument'
import { getClientes } from '@/services/clientes'
import { getAtendimentosByCliente, type Atendimento } from '@/services/atendimentos'
import { toast } from 'sonner'

interface ClienteOption {
  id: string
  nome: string
  cnpj: string
}

export function AtendimentoReportTab() {
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState<string>('')
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingAtendimentos, setLoadingAtendimentos] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const loadClientes = useCallback(async () => {
    setLoadingClientes(true)
    try {
      const data = await getClientes()
      const mapped = (data || [])
        .filter((c: any) => c.nome)
        .map((c: any) => ({ id: c.id, nome: c.nome, cnpj: c.cnpj || '' }))
        .sort((a: ClienteOption, b: ClienteOption) => a.nome.localeCompare(b.nome))
      setClientes(mapped)
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + (error.message || ''))
    } finally {
      setLoadingClientes(false)
    }
  }, [])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  const handleGenerate = async () => {
    if (!selectedClienteId) {
      toast.warning('Selecione um cliente para gerar o relatório.')
      return
    }
    setLoadingAtendimentos(true)
    setHasSearched(true)
    try {
      const data = await getAtendimentosByCliente(selectedClienteId)
      setAtendimentos(data)
      if (data.length === 0) {
        toast.info('Nenhum atendimento encontrado para este cliente.')
      }
    } catch (error: any) {
      toast.error('Erro ao buscar atendimentos: ' + (error.message || ''))
    } finally {
      setLoadingAtendimentos(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId)

  return (
    <div className="space-y-6">
      <Card className="shadow-sm print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-[#1b4382]" />
            Relatório de Atendimento
          </CardTitle>
          <CardDescription>
            Selecione um cliente para gerar um relatório consolidado de todos os atendimentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                Cliente
              </label>
              {loadingClientes ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-slate-50">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400">Carregando clientes...</span>
                </div>
              ) : (
                <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} {cliente.cnpj ? `— ${cliente.cnpj}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedClienteId || loadingAtendimentos}
              className="bg-[#1b4382] hover:bg-[#1b4382]/90 sm:w-auto"
            >
              {loadingAtendimentos ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && selectedCliente && !loadingAtendimentos && (
        <div className="space-y-4">
          <div className="flex items-center justify-between print:hidden">
            <h3 className="text-lg font-semibold text-slate-800">Pré-visualização do Relatório</h3>
            <Button onClick={handlePrint} variant="outline" disabled={atendimentos.length === 0}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / PDF
            </Button>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white print:border-none print:shadow-none">
            <AtendimentoReportDocument
              clientName={selectedCliente.nome}
              clientCnpj={selectedCliente.cnpj}
              atendimentos={atendimentos}
            />
          </div>
        </div>
      )}

      {hasSearched && !selectedCliente && !loadingAtendimentos && (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg print:hidden">
          <p className="text-sm text-slate-500 font-medium">
            Nenhum atendimento encontrado para este cliente
          </p>
        </div>
      )}
    </div>
  )
}
