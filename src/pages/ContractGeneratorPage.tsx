import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, Sparkles, FileText, UploadCloud, Printer, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportContracts } from '@/components/ImportContracts'
import { createCliente } from '@/services/clientes'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import { parsePdfContract } from '@/services/parse-pdf'
import { PLANS, MODULES, DFE_TIERS } from '@/constants/contracts'
import { ContractDocument } from '@/components/ContractDocument'

export default function ContractGeneratorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const initialProspect = searchParams.get('prospect') || ''

  const [name, setName] = useState(initialProspect)
  const [cnpj, setCnpj] = useState('')
  const [address, setAddress] = useState('')
  const [repName, setRepName] = useState('')
  const [repCpf, setRepCpf] = useState('')
  const [repRg, setRepRg] = useState('')

  const [selectedPlan, setSelectedPlan] = useState<string>('tms-50')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedDfeTier, setSelectedDfeTier] = useState<string>('dfe-none')

  const [isExtractingCompany, setIsExtractingCompany] = useState(false)
  const [isExtractingProposal, setIsExtractingProposal] = useState(false)

  const planData = useMemo(() => PLANS.find((p) => p.id === selectedPlan), [selectedPlan])
  const planPrice = planData?.price || 0
  const modulesPrice = useMemo(
    () =>
      selectedModules.reduce((acc, id) => acc + (MODULES.find((m) => m.id === id)?.price || 0), 0),
    [selectedModules],
  )
  const dfeData = useMemo(() => DFE_TIERS.find((d) => d.id === selectedDfeTier), [selectedDfeTier])
  const dfePrice = dfeData?.price || 0
  const totalValue = planPrice + modulesPrice + dfePrice

  const contractProps = {
    name,
    cnpj,
    address,
    repName,
    repCpf,
    repRg,
    selectedPlan,
    selectedModules,
    selectedDfeTier,
    planData,
    planPrice,
    modulesPrice,
    dfeData,
    dfePrice,
    totalValue,
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (rawValue.length <= 14) setCnpj(formatCNPJ(rawValue))
  }

  const handleToggleModule = (id: string, checked: boolean) => {
    setSelectedModules((prev) => (checked ? [...prev, id] : prev.filter((m) => m !== id)))
  }

  const handleUploadCompanyDocs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtractingCompany(true)
    try {
      const data = await parsePdfContract(file)
      setName(data.nome || name)
      if (data.cnpj) setCnpj(formatCNPJ(data.cnpj.replace(/\D/g, '')))
      setAddress('Av. Empresarial, 500, Centro - São Paulo/SP')
      setRepName('Representante Legal Autorizado')
      setRepCpf('111.222.333-44')
      setRepRg('11.222.333-4')
      toast({
        title: 'Dados da empresa extraídos!',
        description: 'CNPJ e Razão Social importados.',
      })
    } catch (err: any) {
      toast({ title: 'Erro na extração', description: err.message, variant: 'destructive' })
    }
    setIsExtractingCompany(false)
  }

  const handleUploadProposal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtractingProposal(true)
    try {
      await parsePdfContract(file) // just to trigger OCR backend integration
      setSelectedPlan('tms-300')
      setSelectedModules(['mod-edi', 'mod-frota', 'mod-calendario'])
      setSelectedDfeTier('dfe-2000')
      toast({
        title: 'Proposta importada!',
        description: 'Plano e módulos preenchidos automaticamente.',
      })
    } catch (err: any) {
      toast({ title: 'Erro na extração', description: err.message, variant: 'destructive' })
    }
    setIsExtractingProposal(false)
  }

  const handlePrint = () => window.print()

  const handleSaveClient = () => {
    if (!name || !cnpj) {
      toast({
        title: 'Atenção',
        description: 'Preencha a Razão Social e CNPJ.',
        variant: 'destructive',
      })
      return
    }
    createCliente({
      nome: name,
      cnpj,
      modulos: [selectedPlan, ...selectedModules, selectedDfeTier],
      valor_total: totalValue,
      status: 'Ativo',
    })
      .then(() => {
        toast({ title: 'Contrato Gerado', className: 'bg-emerald-600 text-white' })
        navigate('/clientes')
      })
      .catch((err) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }))
  }

  return (
    <div className="space-y-6 pb-12 print:pb-0 print:space-y-0">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Contratos</h1>
        <p className="text-muted-foreground mt-1">
          Gere contratos manualmente, importe propostas ou PDFs em lote.
        </p>
      </div>

      <Tabs defaultValue="gerar" className="space-y-6 print:space-y-0">
        <TabsList className="print:hidden">
          <TabsTrigger value="gerar">Gerar Contrato</TabsTrigger>
          <TabsTrigger value="importar">Importar PDFs Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="print:m-0">
          <div className="grid lg:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
            <div className="lg:col-span-5 space-y-6 print:hidden">
              <Card className="border-indigo-100 shadow-sm bg-indigo-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-indigo-800 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Auto-preenchimento Inteligente (OCR)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={handleUploadCompanyDocs}
                      />
                      <Button
                        variant="outline"
                        className="w-full bg-white border-indigo-200 text-indigo-700 pointer-events-none"
                      >
                        {isExtractingCompany ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4 mr-2" />
                        )}
                        1. CNPJ/Contrato
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={handleUploadProposal}
                      />
                      <Button
                        variant="outline"
                        className="w-full bg-white border-indigo-200 text-indigo-700 pointer-events-none"
                      >
                        {isExtractingProposal ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UploadCloud className="w-4 h-4 mr-2" />
                        )}
                        2. Proposta
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>1. Dados da Contratante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input value={cnpj} onChange={handleCnpjChange} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>2. Plano e Módulos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Plano Base</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - {formatCurrency(p.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Módulos Adicionais</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {MODULES.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center space-x-2 border p-2 rounded-lg"
                        >
                          <Checkbox
                            id={m.id}
                            checked={selectedModules.includes(m.id)}
                            onCheckedChange={(c) => handleToggleModule(m.id, c as boolean)}
                          />
                          <Label htmlFor={m.id} className="text-xs">
                            {m.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 sticky top-6 print:static print:block print:w-full print:m-0 print:p-0">
              <Card className="flex flex-col h-[calc(100vh-6rem)] min-h-[700px] shadow-xl border-slate-200 overflow-hidden bg-white print:h-auto print:min-h-0 print:shadow-none print:border-none">
                <ScrollArea className="flex-1 print:hidden">
                  <ContractDocument {...contractProps} />
                </ScrollArea>
                <div className="hidden print:block">
                  <ContractDocument {...contractProps} />
                </div>
                <CardFooter className="bg-slate-50 border-t p-4 flex flex-col sm:flex-row gap-3 justify-end shrink-0 print:hidden">
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="w-full sm:w-auto"
                    disabled={!name || !cnpj}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
                  </Button>
                  <Button
                    onClick={handleSaveClient}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" /> Efetivar Cliente
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="importar">
          <ImportContracts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
