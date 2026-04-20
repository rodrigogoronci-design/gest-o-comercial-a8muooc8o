import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Save, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportContracts } from '@/components/ImportContracts'
import { createCliente } from '@/services/clientes'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import useAppStore from '@/stores/main'
import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const PLANS = [
  { id: 'tms-50', name: 'TMS 50', limit: 'De 0 à 50', maxDocs: '50', price: 400.0 },
  { id: 'tms-100', name: 'TMS 100', limit: 'De 0 à 100', maxDocs: '100', price: 657.0 },
  { id: 'tms-300', name: 'TMS 300', limit: 'De 101 à 300', maxDocs: '300', price: 877.0 },
  { id: 'tms-500', name: 'TMS 500', limit: 'De 301 à 500', maxDocs: '500', price: 1097.0 },
  { id: 'tms-1000', name: 'TMS 1000', limit: 'De 501 à 1000', maxDocs: '1000', price: 1427.0 },
  { id: 'tms-3000', name: 'TMS 3000', limit: 'De 1000 à 3000', maxDocs: '3000', price: 1757.0 },
  { id: 'tms-5000', name: 'TMS 5000', limit: '3001 de 5000', maxDocs: '5000', price: 2087.0 },
  {
    id: 'tms-5000-plus',
    name: 'TMS 5000+',
    limit: 'Acima de 5000',
    maxDocs: '10000',
    price: 2487.0,
  },
  {
    id: 'tms-10000-plus',
    name: 'TMS 10000+',
    limit: 'Acima de 10000',
    maxDocs: 'ilimitado',
    price: 3200.0,
  },
]

const MODULES = [
  { id: 'mod-edi', name: 'EDI', price: 250.0 },
  { id: 'mod-ctrl-viagem', name: 'Controle de Viagem', price: 199.0 },
  { id: 'mod-frota', name: 'Frota (até 10 placas)*', price: 250.0 },
  { id: 'mod-medicao', name: 'Medição', price: 350.0 },
  { id: 'mod-fracionado', name: 'Fracionado', price: 350.0 },
  { id: 'mod-transp', name: 'Transporte (Bloco/TCE/TCI)', price: 350.0 },
  { id: 'mod-fundo-prot', name: 'Fundo de proteção', price: 1201.0 },
  { id: 'mod-fiscal', name: 'Fiscal', price: 199.0 },
  { id: 'mod-calendario', name: 'Calendário', price: 165.0 },
  { id: 'mod-painel', name: 'Painel de Informações', price: 165.0 },
  { id: 'mod-dfe', name: 'DF-e', price: 165.0 },
  { id: 'mod-powerbi', name: 'Power BI', price: 199.0 },
  { id: 'mod-sltrip', name: 'SL-Trip', price: 299.0 },
  { id: 'mod-patrimonio', name: 'Patrimonio', price: 0.0 },
  { id: 'mod-sltrack', name: 'SL-Track', price: 0.0 },
  { id: 'mod-homolog-banc', name: 'Homologação Bancaria', price: 200.0 },
]

const DFE_TIERS = [
  { id: 'dfe-none', name: 'Não contratar pacote D.F.E.', docs: '0', price: 0.0 },
  { id: 'dfe-1000', name: '1000 Doc.', docs: '1000', price: 190.0 },
  { id: 'dfe-2000', name: '2000 Doc.', docs: '2000', price: 290.0 },
  { id: 'dfe-3000', name: '3000 Doc.', docs: '3000', price: 390.0 },
  { id: 'dfe-5000', name: '5000 Doc.', docs: '5000', price: 490.0 },
  { id: 'dfe-10000', name: '10.000 Doc.', docs: '10000', price: 600.0 },
]

const Highlight = ({ value, fallback }: { value: string; fallback: string }) => (
  <strong
    className={cn(
      'mx-1 px-1 rounded transition-colors',
      value
        ? 'bg-transparent font-bold text-slate-900'
        : 'bg-yellow-200/60 font-medium text-yellow-800',
    )}
  >
    {value || fallback}
  </strong>
)

export default function ContractGeneratorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const initialProspect = searchParams.get('prospect') || ''

  const { addClient } = useAppStore()

  // Form State
  const [name, setName] = useState(initialProspect)
  const [cnpj, setCnpj] = useState('')
  const [address, setAddress] = useState('')
  const [repName, setRepName] = useState('')
  const [repCpf, setRepCpf] = useState('')
  const [repRg, setRepRg] = useState('')

  const [selectedPlan, setSelectedPlan] = useState<string>('tms-50')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedDfeTier, setSelectedDfeTier] = useState<string>('dfe-none')

  // Calcs
  const planData = useMemo(() => PLANS.find((p) => p.id === selectedPlan), [selectedPlan])
  const planPrice = planData?.price || 0

  const modulesPrice = useMemo(() => {
    return selectedModules.reduce((acc, id) => {
      const mod = MODULES.find((m) => m.id === id)
      return acc + (mod ? mod.price : 0)
    }, 0)
  }, [selectedModules])

  const dfeData = useMemo(() => DFE_TIERS.find((d) => d.id === selectedDfeTier), [selectedDfeTier])
  const dfePrice = dfeData?.price || 0

  const totalValue = planPrice + modulesPrice + dfePrice

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (rawValue.length <= 14) setCnpj(formatCNPJ(rawValue))
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, '')
    if (rawValue.length > 11) rawValue = rawValue.slice(0, 11)
    rawValue = rawValue.replace(/(\d{3})(\d)/, '$1.$2')
    rawValue = rawValue.replace(/(\d{3})(\d)/, '$1.$2')
    rawValue = rawValue.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    setRepCpf(rawValue)
  }

  const handleToggleModule = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedModules((prev) => [...prev, id])
    } else {
      setSelectedModules((prev) => prev.filter((m) => m !== id))
    }
  }

  const handleSaveClient = () => {
    if (!name || !cnpj) {
      toast({
        title: 'Atenção',
        description: 'Preencha a Razão Social e CNPJ para gerar o contrato.',
        variant: 'destructive',
      })
      return
    }

    const newClient = {
      nome: name,
      cnpj,
      modulos: [selectedPlan, ...selectedModules, selectedDfeTier],
      valor_total: totalValue,
      status: 'Ativo',
    }

    createCliente(newClient)
      .then(() => {
        toast({
          title: 'Contrato Gerado',
          description: 'O contrato foi gerado e o cliente adicionado à base.',
          className: 'bg-emerald-600 text-white',
        })
        navigate('/clientes')
      })
      .catch((err) => {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar o cliente: ' + err.message,
          variant: 'destructive',
        })
      })
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Contratos</h1>
        <p className="text-muted-foreground mt-1">
          Gere novos contratos manualmente ou importe PDFs em lote para sua base.
        </p>
      </div>

      <Tabs defaultValue="gerar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gerar">Gerar Contrato</TabsTrigger>
          <TabsTrigger value="importar">Importar PDFs</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Formulário */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>1. Dados da Contratante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Empresa Exemplo Ltda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={cnpj}
                      onChange={handleCnpjChange}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço Completo (Sede)</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Representante Legal</Label>
                    <Input
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      placeholder="João Silva"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        value={repCpf}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>RG</Label>
                      <Input
                        value={repRg}
                        onChange={(e) => setRepRg(e.target.value)}
                        placeholder="00.000.000-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>2. Plano e Módulos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-700">Plano Base (TMS)</Label>
                    <RadioGroup
                      value={selectedPlan}
                      onValueChange={setSelectedPlan}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {PLANS.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 transition-colors [&:has([data-state=checked])]:border-indigo-600 [&:has([data-state=checked])]:bg-indigo-50/50"
                        >
                          <RadioGroupItem value={p.id} id={p.id} />
                          <Label
                            htmlFor={p.id}
                            className="flex-1 cursor-pointer flex flex-col gap-0.5"
                          >
                            <span className="font-semibold text-sm">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.limit} documentos
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-700">Módulos Adicionais</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MODULES.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start space-x-2 border p-2.5 rounded-lg hover:bg-slate-50 transition-colors [&:has([data-state=checked])]:border-indigo-600 [&:has([data-state=checked])]:bg-indigo-50/50"
                        >
                          <Checkbox
                            id={m.id}
                            checked={selectedModules.includes(m.id)}
                            onCheckedChange={(c) => handleToggleModule(m.id, c as boolean)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={m.id}
                              className="cursor-pointer text-sm font-medium leading-none"
                            >
                              {m.name}
                            </Label>
                          </div>
                          <div className="text-xs font-semibold text-slate-700">
                            {m.price === 0 ? 'Incluso' : formatCurrency(m.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-700">
                      Pacote de Documentos D.F.E.
                    </Label>
                    <Select value={selectedDfeTier} onValueChange={setSelectedDfeTier}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o pacote D.F.E." />
                      </SelectTrigger>
                      <SelectContent>
                        {DFE_TIERS.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name} {tier.price > 0 && `- ${formatCurrency(tier.price)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pré-visualização do Documento */}
            <div className="lg:col-span-7 sticky top-6">
              <Card className="flex flex-col h-[calc(100vh-6rem)] min-h-[700px] shadow-xl border-slate-200 overflow-hidden bg-white">
                <ScrollArea className="flex-1">
                  <div className="p-8 sm:p-12 text-[13px] text-slate-800 font-serif leading-relaxed space-y-5">
                    <div className="text-center mb-8">
                      <h1 className="text-base font-bold uppercase underline underline-offset-4">
                        CONTRATO DE LICENÇA DE USO E SERVIÇOS DE IMPLANTAÇÃO, MANUTENÇÃO E SUPORTE
                        DE SOFTWARE
                      </h1>
                    </div>

                    <div className="space-y-4 text-justify">
                      <p>Pelo presente instrumento particular, de um lado:</p>

                      <p className="pl-5 border-l-2 border-slate-200">
                        <strong>CONTRATADA:</strong>{' '}
                        <strong>CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA</strong>, pessoa jurídica de
                        direito privado, inscrita no CNPJ sob o nº 12.345.678/0001-99, com sede na
                        Av. Inovação, 1000, Ed. Tech, São Paulo - SP.
                      </p>

                      <p className="pl-5 border-l-2 border-slate-200">
                        <strong>CONTRATANTE:</strong>{' '}
                        <Highlight value={name} fallback="[NOME DA EMPRESA]" />, pessoa jurídica de
                        direito privado, inscrita no CNPJ sob o nº{' '}
                        <Highlight value={cnpj} fallback="[CNPJ]" />, com sede em{' '}
                        <Highlight value={address} fallback="[ENDEREÇO DA SEDE]" />, neste ato
                        representada por seu representante legal, Sr(a).{' '}
                        <Highlight value={repName} fallback="[NOME DO REPRESENTANTE]" />,
                        portador(a) do RG nº <Highlight value={repRg} fallback="[RG]" /> e CPF nº{' '}
                        <Highlight value={repCpf} fallback="[CPF]" />.
                      </p>

                      <p>
                        As partes acima qualificadas celebram o presente CONTRATO, que se regerá
                        pelas cláusulas e condições a seguir:
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">CLÁUSULA 1 - DO OBJETO</h3>
                      <p>
                        1.1. O presente contrato tem por objeto o licenciamento de uso do software
                        comercial desenvolvido pela CONTRATADA, por prazo indeterminado, bem como a
                        prestação de serviços de implantação, manutenção e suporte técnico, conforme
                        plano e módulos escolhidos na Cláusula 5.
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 2 - CONDIÇÕES DE USO
                      </h3>
                      <p>
                        2.1. A CONTRATADA concede à CONTRATANTE uma licença revogável, não exclusiva
                        e intransferível de uso do software.
                      </p>
                      <p>
                        2.2. A CONTRATANTE terá acesso ao sistema mediante login e senha exclusivos,
                        comprometendo-se a manter sigilo absoluto das credenciais.
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 3 - IMPLANTAÇÃO E TREINAMENTO
                      </h3>
                      <p>
                        3.1. A implantação do sistema será realizada de forma remota, em cronograma
                        a ser acordado entre as partes.
                      </p>
                      <p>
                        3.2. A CONTRATADA disponibilizará manuais e vídeos de treinamento online.
                        Treinamentos in loco, caso solicitados, terão custo adicional sujeito a
                        orçamento prévio.
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 4 - SUPORTE TÉCNICO E MANUTENÇÃO
                      </h3>
                      <p>
                        4.1. O suporte técnico será prestado em horário comercial (08:00 às 18:00,
                        de segunda a sexta-feira, exceto feriados) através dos canais de atendimento
                        oficiais (chat, e-mail e telefone).
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 5 - REMUNERAÇÃO E CONDIÇÕES DE PAGAMENTO
                      </h3>
                      <p>
                        5.1. <strong>Planos de Licenciamento (TMS):</strong> A CONTRATANTE opta pelo
                        plano assinalado com "X" abaixo, sujeitando-se aos limites de emissão
                        estipulados:
                      </p>

                      <div className="overflow-x-auto my-3">
                        <table className="w-full text-[11px] border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-300 p-1.5 text-left">Planos</th>
                              <th className="border border-slate-300 p-1.5 text-left">
                                CTe+NFSe/mês
                              </th>
                              <th className="border border-slate-300 p-1.5 text-left">
                                Nº Usuários
                              </th>
                              <th className="border border-slate-300 p-1.5 text-left">Máx docs</th>
                              <th className="border border-slate-300 p-1.5 text-right">
                                Valor (R$)
                              </th>
                              <th className="border border-slate-300 p-1.5 text-center">
                                Contratado
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {PLANS.map((p) => (
                              <tr
                                key={p.id}
                                className={selectedPlan === p.id ? 'bg-indigo-50/50' : ''}
                              >
                                <td className="border border-slate-300 p-1.5">{p.name}</td>
                                <td className="border border-slate-300 p-1.5">{p.limit}</td>
                                <td className="border border-slate-300 p-1.5">Ilimitado</td>
                                <td className="border border-slate-300 p-1.5">{p.maxDocs}</td>
                                <td className="border border-slate-300 p-1.5 text-right">
                                  {formatCurrency(p.price)}
                                </td>
                                <td className="border border-slate-300 p-1.5 text-center font-bold text-indigo-700">
                                  {selectedPlan === p.id ? 'X' : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="mt-4">
                        5.7. <strong>Módulos Adicionais:</strong> A CONTRATANTE opta por incluir os
                        módulos assinalados com "X" abaixo:
                      </p>

                      <div className="overflow-x-auto my-3">
                        <table className="w-full text-xs border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-300 p-2 text-left">
                                Módulo Adicional
                              </th>
                              <th className="border border-slate-300 p-2 text-right">
                                Mensalidade (R$)
                              </th>
                              <th className="border border-slate-300 p-2 text-center">
                                Contratado
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {MODULES.map((m) => (
                              <tr
                                key={m.id}
                                className={selectedModules.includes(m.id) ? 'bg-indigo-50/50' : ''}
                              >
                                <td className="border border-slate-300 p-2">{m.name}</td>
                                <td className="border border-slate-300 p-2 text-right">
                                  {m.price === 0 ? 'Incluso' : formatCurrency(m.price)}
                                </td>
                                <td className="border border-slate-300 p-2 text-center font-bold text-indigo-700 text-sm">
                                  {selectedModules.includes(m.id) ? 'X' : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {selectedDfeTier !== 'dfe-none' && (
                        <>
                          <p className="mt-4">
                            5.15. <strong>Pacote de Documentos D.F.E.:</strong> A CONTRATANTE opta
                            pelo pacote assinalado com "X" abaixo:
                          </p>

                          <div className="overflow-x-auto my-3">
                            <table className="w-full text-xs border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-2 text-left">
                                    Pacote D.F.E.
                                  </th>
                                  <th className="border border-slate-300 p-2 text-right">
                                    Valor Mensal (R$)
                                  </th>
                                  <th className="border border-slate-300 p-2 text-center">
                                    Contratado
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {DFE_TIERS.filter((t) => t.id !== 'dfe-none').map((t) => (
                                  <tr
                                    key={t.id}
                                    className={selectedDfeTier === t.id ? 'bg-indigo-50/50' : ''}
                                  >
                                    <td className="border border-slate-300 p-2">{t.name}</td>
                                    <td className="border border-slate-300 p-2 text-right">
                                      {formatCurrency(t.price)}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-center font-bold text-indigo-700 text-sm">
                                      {selectedDfeTier === t.id ? 'X' : ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 italic">
                            * Documentos excedentes custam R$ 0,30 cada.
                          </p>
                        </>
                      )}

                      <p className="mt-4">
                        5.22. <strong>Resumo Financeiro Mensal:</strong> A soma dos itens
                        contratados perfaz o valor geral demonstrado na tabela a seguir, com
                        vencimento todo dia 10 de cada mês, mediante boleto bancário.
                      </p>

                      <div className="overflow-x-auto my-3">
                        <table className="w-full text-xs border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-300 p-2 text-left">Descrição</th>
                              <th className="border border-slate-300 p-2 text-right">
                                Valor Mensal (R$)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-2">
                                Mensalidade do Plano ({planData?.name})
                              </td>
                              <td className="border border-slate-300 p-2 text-right">
                                {formatCurrency(planPrice)}
                              </td>
                            </tr>
                            {selectedModules.length > 0 && (
                              <tr>
                                <td className="border border-slate-300 p-2">
                                  Módulos Adicionais ({selectedModules.length})
                                </td>
                                <td className="border border-slate-300 p-2 text-right">
                                  {formatCurrency(modulesPrice)}
                                </td>
                              </tr>
                            )}
                            {selectedDfeTier !== 'dfe-none' && (
                              <tr>
                                <td className="border border-slate-300 p-2">
                                  Pacote D.F.E. ({dfeData?.name})
                                </td>
                                <td className="border border-slate-300 p-2 text-right">
                                  {formatCurrency(dfePrice)}
                                </td>
                              </tr>
                            )}
                            <tr className="bg-slate-50 font-bold">
                              <td className="border border-slate-300 p-2 uppercase text-right">
                                Valor Geral Mensal
                              </td>
                              <td className="border border-slate-300 p-2 text-right text-emerald-700 text-sm">
                                {formatCurrency(totalValue)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 6 - OBRIGAÇÕES DA CONTRATANTE
                      </h3>
                      <p>
                        6.1. Fornecer infraestrutura de hardware, software e acesso à internet
                        compatíveis com os requisitos mínimos recomendados pela CONTRATADA.
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 7 - OBRIGAÇÕES DA CONTRATADA
                      </h3>
                      <p>
                        7.1. Manter o software em pleno funcionamento, garantindo uma
                        disponibilidade (SLA) de 99% no período mensal, excluindo-se paradas
                        programadas para manutenção.
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 8 - CONFIDENCIALIDADE E PROTEÇÃO DE DADOS
                      </h3>
                      <p>
                        8.1. As partes obrigam-se a manter sigilo sobre todas as informações
                        confidenciais a que tiverem acesso, cumprindo integralmente as disposições
                        da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">
                        CLÁUSULA 9 - PRAZO E RESCISÃO
                      </h3>
                      <p>9.1. O presente contrato é celebrado por prazo indeterminado.</p>
                      <p>
                        9.2. Qualquer das partes poderá rescindir este contrato imotivadamente
                        mediante aviso prévio por escrito de, no mínimo, 30 (trinta) dias de
                        antecedência, sem incidência de multa rescisória após decorridos 6 (seis)
                        meses de fidelidade inicial.
                      </p>

                      <h3 className="font-bold uppercase mt-6 text-sm">CLÁUSULA 10 - FORO</h3>
                      <p>
                        10.1. Fica eleito o foro da comarca da sede da CONTRATADA para dirimir
                        quaisquer dúvidas ou litígios oriundos deste contrato, com renúncia expressa
                        a qualquer outro, por mais privilegiado que seja.
                      </p>

                      <div className="mt-12 text-center space-y-10">
                        <p>
                          E por estarem justos e contratados, assinam o presente instrumento
                          eletronicamente.
                        </p>

                        <div className="grid grid-cols-2 gap-8 mt-10">
                          <div className="border-t border-slate-800 pt-2 text-center">
                            <p className="font-bold">CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA</p>
                            <p className="text-[11px] text-slate-500">CONTRATADA</p>
                          </div>
                          <div className="border-t border-slate-800 pt-2 text-center">
                            <p className="font-bold uppercase">
                              <Highlight value={name} fallback="[NOME DA EMPRESA]" />
                            </p>
                            <p className="text-[11px] text-slate-500">CONTRATANTE</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <CardFooter className="bg-slate-50 border-t p-4 flex flex-col sm:flex-row gap-3 justify-end shrink-0">
                  <Button variant="outline" className="w-full sm:w-auto" disabled={!name || !cnpj}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    disabled={!name || !cnpj}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Assinatura
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
        </TabsContent>

        <TabsContent value="importar">
          <ImportContracts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
