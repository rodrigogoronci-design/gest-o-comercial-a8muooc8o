import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Building, CheckCircle2, Download, Save, Send } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/main'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'

export default function ContractGeneratorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const initialProspect = searchParams.get('prospect') || ''

  const { modules, addClient } = useAppStore()

  const [name, setName] = useState(initialProspect)
  const [cnpj, setCnpj] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  // Real-time calculation
  const totalValue = useMemo(() => {
    return selectedModules.reduce((acc, id) => {
      const mod = modules.find((m) => m.id === id)
      return acc + (mod ? mod.price : 0)
    }, 0)
  }, [selectedModules, modules])

  // Handle CNPJ mask inline
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (rawValue.length <= 14) {
      setCnpj(formatCNPJ(rawValue))
    }
  }

  const handleToggleModule = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedModules((prev) => [...prev, id])
    } else {
      setSelectedModules((prev) => prev.filter((m) => m !== id))
    }
  }

  const handleSaveClient = () => {
    if (!name || !cnpj || selectedModules.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Preencha os dados e selecione ao menos um módulo.',
        variant: 'destructive',
      })
      return
    }

    const newClient = {
      id: `c${Date.now()}`,
      name,
      cnpj,
      modules: selectedModules,
      totalValue,
      createdAt: new Date().toISOString(),
    }

    addClient(newClient)
    toast({
      title: 'Sucesso!',
      description: 'Contrato gerado e cliente adicionado à base.',
      className: 'bg-emerald-600 text-white border-none',
    })
    navigate('/clientes')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerador de Contratos</h1>
        <p className="text-muted-foreground mt-1">
          Configure o plano e gere o contrato instantaneamente.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Formulário - Lado Esquerdo */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-xs font-bold">
                  1
                </span>
                <span className="font-semibold text-sm uppercase tracking-wider">
                  Identificação
                </span>
              </div>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social</Label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Empresa Exemplo Ltda"
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={handleCnpjChange}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-xs font-bold">
                  2
                </span>
                <span className="font-semibold text-sm uppercase tracking-wider">Configuração</span>
              </div>
              <CardTitle>Seleção de Módulos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${selectedModules.includes(mod.id) ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                  <Checkbox
                    id={`mod-${mod.id}`}
                    checked={selectedModules.includes(mod.id)}
                    onCheckedChange={(c) => handleToggleModule(mod.id, c as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`mod-${mod.id}`}
                      className="font-medium cursor-pointer text-base"
                    >
                      {mod.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  </div>
                  <div className="font-semibold text-slate-900">{formatCurrency(mod.price)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Document Preview - Lado Direito */}
        <div className="lg:col-span-7 sticky top-6">
          <Card className="border-slate-200/60 shadow-md bg-white min-h-[600px] flex flex-col">
            <div className="p-8 pb-4 flex-1">
              <div className="border-b-2 border-slate-900 pb-6 mb-8 text-center">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-900">
                  Contrato de Prestação de Serviços
                </h2>
                <p className="text-sm text-slate-500 mt-2">Termo de adesão a software comercial</p>
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
                <p>
                  Pelo presente instrumento, a CONTRATADA fornece licenciamento de uso do software
                  para a empresa
                  <strong className="mx-1 px-1 bg-yellow-100/50 rounded">
                    {name || '[RAZÃO SOCIAL]'}
                  </strong>
                  , inscrita no CNPJ sob o nº
                  <strong className="mx-1 px-1 bg-yellow-100/50 rounded font-mono">
                    {cnpj || '[00.000.000/0001-00]'}
                  </strong>
                  .
                </p>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    1. Objeto e Módulos Contratados
                  </h3>
                  <p className="mb-2">
                    A licença contempla estritamente os seguintes módulos selecionados:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedModules.length > 0 ? (
                      selectedModules.map((id) => {
                        const m = modules.find((x) => x.id === id)
                        return (
                          <li key={id}>
                            <strong>{m?.name}</strong>: {m?.description}
                          </li>
                        )
                      })
                    ) : (
                      <li className="text-slate-400 italic">
                        Nenhum módulo selecionado no momento.
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">2. Remuneração</h3>
                  <p>
                    Pelos serviços prestados, a CONTRATANTE pagará o valor mensal de
                    {/* Pulse Animation Key trick applied here */}
                    <span
                      key={totalValue}
                      className="animate-pulse mx-1 font-bold text-emerald-600 text-lg bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block"
                    >
                      {formatCurrency(totalValue)}
                    </span>
                    mediante boleto bancário com vencimento todo dia 10.
                  </p>
                </div>

                <div className="pt-12 text-center text-xs text-slate-400">
                  Documento gerado em {formatDate(new Date().toISOString())} via Plataforma de
                  Gestão Comercial
                </div>
              </div>
            </div>

            <CardFooter className="bg-slate-50 border-t p-6 flex flex-col sm:flex-row gap-3 justify-end rounded-b-xl">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={!name || selectedModules.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                disabled={!name || selectedModules.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar por E-mail
              </Button>
              <Button
                onClick={handleSaveClient}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                <Save className="mr-2 h-4 w-4" />
                Efetivar Cliente
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
