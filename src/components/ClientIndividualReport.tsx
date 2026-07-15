import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  UserRound,
  ChevronDown,
  Check,
  FileText,
  Package,
  DollarSign,
  CalendarDays,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClientesParaRelatorioIndividual,
  type ClienteDetalhado,
} from '@/services/relatorio-cliente-individual'
import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import { cn } from '@/lib/utils'

function parseModulos(modulos: any): string[] {
  if (!modulos || !Array.isArray(modulos) || modulos.length === 0) return []
  return modulos.map((m: any) => {
    if (typeof m === 'string') return m
    if (typeof m === 'object' && m !== null) {
      return m.nome || m.name || m.descricao || m.label || m.key || JSON.stringify(m)
    }
    return String(m)
  })
}

function InfoBlock({
  icon: Icon,
  label,
  children,
}: {
  icon: any
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[#1b4382]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  )
}

export function ClientIndividualReport() {
  const [clientes, setClientes] = useState<ClienteDetalhado[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClientesParaRelatorioIndividual()
      setClientes(data)
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + (error.message || ''))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedClient = clientes.find((c) => c.id === selectedId) ?? null
  const modulosList = selectedClient ? parseModulos(selectedClient.modulos) : []

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-[#1b4382]" />
            Relatório Individual de Cliente
          </CardTitle>
          <CardDescription>
            Selecione um cliente para visualizar informações detalhadas de contrato, plano, módulos
            e valores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Selecionar Cliente</label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between font-normal"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando clientes...
                      </>
                    ) : selectedClient ? (
                      <span className="flex items-center gap-2 truncate">
                        <span className="font-medium text-slate-800">{selectedClient.nome}</span>
                        {selectedClient.cnpj && (
                          <span className="text-slate-400 text-xs">
                            {formatCNPJ(selectedClient.cnpj)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-2">
                        <Search className="h-4 w-4" /> Buscar cliente...
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nome ou CNPJ..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((cliente) => (
                          <CommandItem
                            key={cliente.id}
                            value={`${cliente.nome} ${cliente.cnpj ?? ''}`}
                            onSelect={() => {
                              setSelectedId(cliente.id === selectedId ? null : cliente.id)
                              setPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedId === cliente.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{cliente.nome}</span>
                              {cliente.cnpj && (
                                <span className="text-xs text-slate-400">
                                  {formatCNPJ(cliente.cnpj)}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {!loading && !selectedClient && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-4 mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-base font-medium text-slate-600">Nenhum cliente selecionado</p>
                <p className="text-sm text-slate-400 mt-1">
                  Selecione um cliente acima para visualizar o relatório detalhado.
                </p>
              </div>
            )}

            {selectedClient && (
              <div className="animate-fade-in rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#1b4382] to-[#2a5fa8] px-6 py-4">
                  <h3 className="text-lg font-bold text-white">{selectedClient.nome}</h3>
                  <p className="text-sm text-blue-100">
                    {selectedClient.cnpj ? formatCNPJ(selectedClient.cnpj) : 'CNPJ não informado'}
                  </p>
                </div>
                <div className="p-6 grid gap-4 md:grid-cols-2">
                  <InfoBlock icon={FileText} label="Plano de Franquia Atual">
                    {selectedClient.plano_descricao ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800">
                          {selectedClient.plano_descricao}
                        </p>
                        {selectedClient.plano_codigo && (
                          <p className="text-xs text-slate-500">
                            Código: {selectedClient.plano_codigo}
                          </p>
                        )}
                        {selectedClient.com_coparticipacao !== null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              selectedClient.com_coparticipacao
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-green-50 text-green-700 border-green-200',
                            )}
                          >
                            {selectedClient.com_coparticipacao
                              ? 'Com coparticipação'
                              : 'Sem coparticipação'}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </InfoBlock>

                  <InfoBlock icon={Package} label="Módulos Contratados">
                    {modulosList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {modulosList.map((modulo, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-[#1b4382]/10 text-[#1b4382] hover:bg-[#1b4382]/15"
                          >
                            {modulo}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </InfoBlock>

                  <InfoBlock icon={DollarSign} label="Valor da Mensalidade">
                    {selectedClient.valor_total != null && selectedClient.valor_total > 0 ? (
                      <p className="text-xl font-bold text-slate-800">
                        {formatCurrency(selectedClient.valor_total)}
                      </p>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </InfoBlock>

                  <InfoBlock icon={CalendarDays} label="Data de Vencimento">
                    {selectedClient.vencimento_mensal != null ? (
                      <p className="text-xl font-bold text-slate-800">
                        Dia {selectedClient.vencimento_mensal}
                      </p>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </InfoBlock>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
