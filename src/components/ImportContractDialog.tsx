import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  CreditCard,
  Layers,
  MapPin,
  User,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { parsePdfContract, ExtractedContractData } from '@/services/parse-pdf'
import { createCliente, updateCliente } from '@/services/clientes'
import { createHistorico } from '@/services/historico_contratos'
import { uploadDocumentacaoFile, ensureChecklistForClient } from '@/services/documentacao-adesao'
import { fetchCnpjData } from '@/services/cnpj'
import { supabase } from '@/lib/supabase/client'
import { MODULES, PLANS } from '@/constants/contracts'
import { formatCNPJ } from '@/lib/cpf-utils'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface ExistingClientMatch {
  id: string
  nome: string
  cnpj: string
  valor_total: number
  plano_id?: string | null
  status?: string
}

interface ImportContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (clientId: string) => void
}

export function ImportContractDialog({ open, onOpenChange, onSuccess }: ImportContractDialogProps) {
  const [step, setStep] = useState<'upload' | 'review' | 'saving'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEnrichingCnpj, setIsEnrichingCnpj] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dados em conferência (editáveis pelo usuário)
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [endereco, setEndereco] = useState('')
  const [repNome, setRepNome] = useState('')
  const [repCpf, setRepCpf] = useState('')
  const [repRg, setRepRg] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [planoBase, setPlanoBase] = useState('')
  const [valorMensalidade, setValorMensalidade] = useState<number>(0)
  const [valorImplantacao, setValorImplantacao] = useState<number>(0)
  const [dataAssinatura, setDataAssinatura] = useState('')
  const [vencimentoMensal, setVencimentoMensal] = useState<number | ''>('')
  const [vigencia, setVigencia] = useState('')
  const [modulos, setModulos] = useState<string[]>([])
  const [filiais, setFiliais] = useState<Array<{ nome: string; cnpj: string; isenta?: boolean }>>(
    [],
  )

  // Auxiliar para adicionar novo módulo na conferência
  const [newModuleName, setNewModuleName] = useState('')
  // Auxiliar para adicionar filial na conferência
  const [newFilialNome, setNewFilialNome] = useState('')
  const [newFilialCnpj, setNewFilialCnpj] = useState('')

  // Verificação de CNPJ existente
  const [existingClient, setExistingClient] = useState<ExistingClientMatch | null>(null)
  const [duplicateResolution, setDuplicateResolution] = useState<'link' | 'create_new'>('link')

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setStep('upload')
      setFile(null)
      setIsProcessing(false)
      setIsEnrichingCnpj(false)
      setExistingClient(null)
      setDuplicateResolution('link')
      setNome('')
      setCnpj('')
      setEndereco('')
      setRepNome('')
      setRepCpf('')
      setRepRg('')
      setEmail('')
      setTelefone('')
      setPlanoBase('')
      setValorMensalidade(0)
      setValorImplantacao(0)
      setDataAssinatura('')
      setVencimentoMensal('')
      setVigencia('')
      setModulos([])
      setFiliais([])
      setNewModuleName('')
      setNewFilialNome('')
      setNewFilialCnpj('')
    }
  }, [open])

  // Normalização de módulo contra o catálogo
  const resolveModuleName = (rawName: string): string => {
    const trimmed = rawName.trim()
    const lower = trimmed.toLowerCase()

    // 1. Busca exata ou case-insensitive no catálogo central
    const found = MODULES.find(
      (m) => m.name.toLowerCase() === lower || m.id.toLowerCase() === lower,
    )
    if (found) return found.name

    // 2. Variações conhecidas
    if (
      lower === 'b.i.' ||
      lower === 'bi' ||
      lower.includes('power bi') ||
      lower.includes('powerbi') ||
      lower.includes('bi web') ||
      lower.includes('biweb') ||
      lower.includes('bi-web')
    ) {
      return 'BI WEB'
    }
    if (lower === 'df-e' || lower === 'dfe') {
      return 'DF-e'
    }
    if (lower.includes('bloco tci') || lower.includes('tci e tce')) {
      return 'Bloco TCI e TCE (Transportes)'
    }
    if (lower.includes('frota') && (lower.includes('20') || lower.includes('vinte'))) {
      return 'Frota – Até 20 Placas'
    }
    if (lower.includes('frota')) {
      return 'Frota (até 10 placas)'
    }
    if (lower.includes('torre de controle')) {
      return 'Torre de Controle Logística'
    }
    if (lower.includes('homolog') && lower.includes('banc')) {
      return 'Homologação Bancaria'
    }
    if (lower.includes('fundo de prote')) {
      return 'Fundo de proteção'
    }
    if (lower.includes('painel de info')) {
      return 'Painel de Informações'
    }
    if (lower.includes('controle de viagem')) {
      return 'Controle de Viagem'
    }

    if (
      lower.includes('transporte (bloco/tce/tci)') ||
      lower.includes('transporte (bloco tci/tce)') ||
      lower.includes('bloco/tce/tci') ||
      lower.includes('bloco tci/tce')
    ) {
      return 'Transporte (Bloco TCI/TCE)'
    }

    // Se estiver fora do catálogo, grava o nome do contrato exatamente como citado
    return trimmed
  }

  // Verifica se CNPJ já existe na base
  const checkCnpjDuplicate = async (cleanCnpj: string, formattedCnpj: string) => {
    if (!cleanCnpj || cleanCnpj.length < 11) {
      setExistingClient(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, cnpj, valor_total, plano_id, status')
        .or(`cnpj.eq.${cleanCnpj},cnpj.eq.${formattedCnpj}`)
        .limit(1)

      if (!error && data && data.length > 0) {
        setExistingClient(data[0] as ExistingClientMatch)
        setDuplicateResolution('link')
      } else {
        setExistingClient(null)
      }
    } catch (err) {
      console.warn('Erro ao verificar duplicidade de CNPJ:', err)
      setExistingClient(null)
    }
  }

  const handleProcessPdf = async (selectedFile: File) => {
    if (
      selectedFile.type !== 'application/pdf' &&
      !selectedFile.name.toLowerCase().endsWith('.pdf')
    ) {
      toast.error('Apenas arquivos PDF são aceitos.')
      return
    }

    setIsProcessing(true)
    setFile(selectedFile)

    try {
      const extracted: ExtractedContractData = await parsePdfContract(selectedFile)

      // Extrai e normaliza campos
      const extractedNome = extracted.nome ? extracted.nome.trim() : ''
      const rawCnpj = (extracted.cnpj || '').replace(/\D/g, '')
      const formattedCnpj = rawCnpj.length === 14 ? formatCNPJ(rawCnpj) : extracted.cnpj || ''

      setNome(extractedNome)
      setCnpj(formattedCnpj)
      setEndereco(extracted.endereco ? extracted.endereco.trim() : '')
      setRepNome(extracted.repName ? extracted.repName.trim() : '')
      setRepCpf(extracted.repCpf ? extracted.repCpf.trim() : '')
      setRepRg(extracted.repRg ? extracted.repRg.trim() : '')
      setEmail(extracted.email ? extracted.email.trim() : '')
      setTelefone(extracted.telefone ? extracted.telefone.trim() : '')
      setPlanoBase(extracted.planoBase ? extracted.planoBase.trim() : '')
      setValorMensalidade(extracted.valor_mensalidade || extracted.valor_total || 0)
      setValorImplantacao(extracted.valor_implantacao || 0)
      setDataAssinatura(extracted.data_assinatura || '')
      setVencimentoMensal(
        typeof extracted.vencimento_mensal === 'number' ? extracted.vencimento_mensal : '',
      )
      setVigencia(extracted.vigencia ? extracted.vigencia.trim() : '')

      // Módulos
      const rawList =
        extracted.modulos_nomes && extracted.modulos_nomes.length > 0
          ? extracted.modulos_nomes
          : extracted.modulos || []
      const normalizedModules = Array.from(
        new Set(rawList.map((m) => resolveModuleName(m)).filter(Boolean)),
      )
      setModulos(normalizedModules)

      // Filiais
      if (Array.isArray(extracted.filiais)) {
        setFiliais(
          extracted.filiais.map((f) => ({
            nome: f.nome || `Filial (${f.cnpj})`,
            cnpj: formatCNPJ(f.cnpj) || f.cnpj,
            isenta: !!f.isenta,
          })),
        )
      } else {
        setFiliais([])
      }

      // Checa duplicidade de CNPJ na base
      await checkCnpjDuplicate(rawCnpj, formattedCnpj)

      // Tenta enriquecer nome via Receita Federal se CNPJ for válido e o nome do contrato estiver vazio ou curto
      if (rawCnpj.length === 14 && (!extractedNome || extractedNome.length < 4)) {
        setIsEnrichingCnpj(true)
        try {
          const { data: cnpjData } = await fetchCnpjData(rawCnpj)
          if (cnpjData?.nome) {
            setNome(cnpjData.nome)
            if (cnpjData.endereco && !extracted.endereco) {
              setEndereco(cnpjData.endereco)
            }
          }
        } catch {
          // Mantém o que tem
        } finally {
          setIsEnrichingCnpj(false)
        }
      }

      setStep('review')
    } catch (err: any) {
      const msg = err.message || 'Falha ao processar o contrato em PDF.'
      toast.error(
        msg.includes('não foi possível')
          ? 'Não foi possível identificar o padrão do contrato. Verifique o arquivo e tente novamente.'
          : msg,
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualCnpjBlur = async () => {
    const raw = cnpj.replace(/\D/g, '')
    const formatted = raw.length === 14 ? formatCNPJ(raw) : cnpj
    setCnpj(formatted)
    if (raw.length === 14) {
      await checkCnpjDuplicate(raw, formatted)
      if (!nome) {
        setIsEnrichingCnpj(true)
        try {
          const { data: cnpjData } = await fetchCnpjData(raw)
          if (cnpjData?.nome) {
            setNome(cnpjData.nome)
            if (cnpjData.endereco && !endereco) setEndereco(cnpjData.endereco)
            toast.success('Razão Social obtida via Receita Federal!')
          }
        } catch {
          // ignora
        } finally {
          setIsEnrichingCnpj(false)
        }
      }
    }
  }

  const handleAddModule = () => {
    const trimmed = newModuleName.trim()
    if (!trimmed) return
    const canonical = resolveModuleName(trimmed)
    if (!modulos.includes(canonical)) {
      setModulos([...modulos, canonical])
    }
    setNewModuleName('')
  }

  const handleRemoveModule = (modName: string) => {
    setModulos(modulos.filter((m) => m !== modName))
  }

  const handleAddFilial = () => {
    const raw = newFilialCnpj.replace(/\D/g, '')
    const formatted = raw.length === 14 ? formatCNPJ(raw) : newFilialCnpj.trim()
    const nomeFil = newFilialNome.trim() || `Filial (${formatted})`
    if (!formatted) {
      toast.error('Informe o CNPJ da filial')
      return
    }
    setFiliais([...filiais, { nome: nomeFil, cnpj: formatted, isenta: false }])
    setNewFilialNome('')
    setNewFilialCnpj('')
  }

  const handleRemoveFilial = (index: number) => {
    setFiliais(filiais.filter((_, i) => i !== index))
  }

  const handleConfirmSave = async () => {
    if (!nome.trim()) {
      toast.error('Por favor, informe a Razão Social do cliente antes de gravar.')
      return
    }

    setStep('saving')
    try {
      // 1. Upload do PDF para o bucket 'contracts' (bucket do contrato do cliente)
      let contratoUrl: string | null = null
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `contratos-importados/${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(storagePath, file, { upsert: true })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('contracts')
            .getPublicUrl(storagePath)
          contratoUrl = publicUrlData?.publicUrl || null
        } else {
          console.warn('Falha no upload para bucket contracts:', uploadError)
        }
      }

      // 2. Resolve plano_id em planos_saude
      let planoId: string | null = null
      if (planoBase) {
        const cleanPlanoCode = planoBase.replace(/\s+/g, '-').toUpperCase()
        const { data: planoRows } = await supabase
          .from('planos_saude')
          .select('id, codigo, descricao')
          .limit(50)

        if (planoRows && planoRows.length > 0) {
          const match = planoRows.find(
            (p) =>
              (p.codigo && p.codigo.toUpperCase() === cleanPlanoCode) ||
              (p.codigo && p.codigo.toUpperCase().replace(/^ERP-/, '') === cleanPlanoCode) ||
              (p.descricao && p.descricao.toUpperCase().includes(cleanPlanoCode)),
          )
          if (match) planoId = match.id
        }
      }

      // Formatação dos módulos no formato esperado pelo sistema
      const modulosPayload = {
        plano_base: planoBase || null,
        filiais: filiais.length,
        adicionais: modulos.map((m) => {
          const modDef = MODULES.find((def) => def.name.toLowerCase() === m.toLowerCase())
          return {
            name: m,
            price: modDef ? modDef.price : 0,
          }
        }),
        filiais_detalhes: filiais,
      }

      // 3. Monta payload do cliente
      // Regra permanente: a mensalidade (valor_total) vem EXATAMENTE do que foi informado no contrato
      const clientPayload: Record<string, any> = {
        nome: nome.trim(),
        cnpj: cnpj.trim() || null,
        endereco: endereco.trim() || null,
        rep_nome: repNome.trim() || null,
        rep_cpf: repCpf.trim() || null,
        rep_rg: repRg.trim() || null,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        valor_total: valorMensalidade,
        valor_mensalidade: valorMensalidade,
        valor_implantacao: valorImplantacao,
        plano_id: planoId,
        data_assinatura: dataAssinatura || null,
        vencimento_mensal: typeof vencimentoMensal === 'number' ? vencimentoMensal : null,
        quantidade_filiais: filiais.length,
        filiais_detalhes: filiais,
        modulos: modulosPayload,
        status: 'Ativo',
      }

      if (contratoUrl) {
        clientPayload.contrato_url = contratoUrl
      }

      let savedClientId: string

      if (existingClient && duplicateResolution === 'link') {
        // Atualiza cliente existente com os dados informados no contrato
        const updated = await updateCliente(existingClient.id, clientPayload)
        savedClientId = updated.id
      } else {
        // Cria novo cliente
        const created = await createCliente(clientPayload)
        savedClientId = created.id
      }

      // 4. Registra no histórico de contratos do cliente
      try {
        await createHistorico({
          cliente_id: savedClientId,
          tipo: 'Contrato',
          data_solicitacao: dataAssinatura || new Date().toISOString().split('T')[0],
          plano: planoBase || 'Contrato Importado',
          modulos: modulos.map((m) => ({ name: m })),
          valor_total: valorMensalidade,
          status: 'Assinado',
          observacoes: `Contrato assinado importado em ${new Date().toLocaleDateString('pt-BR')}.${vigencia ? ` Vigência: ${vigencia}.` : ''} Documento PDF anexado.`,
        })
      } catch (histErr) {
        console.warn('Erro ao registrar histórico de contrato:', histErr)
      }

      // 5. Anexa o PDF na aba Documentação do cliente (seguindo o padrão DocumentacaoAdesaoTab)
      if (file) {
        try {
          const checklist = await ensureChecklistForClient(savedClientId)
          // Procura o item de Contrato Social ou similar na categoria Matriz
          const contratoSocialItem = checklist.find(
            (it) =>
              it.categoria === 'EMPRESA (Matriz)' &&
              (it.item.toLowerCase().includes('contrato') ||
                it.item.toLowerCase().includes('social')),
          )

          if (contratoSocialItem) {
            await uploadDocumentacaoFile(savedClientId, contratoSocialItem.id, file)
          } else {
            // Se não encontrou item correspondente, anexa ao primeiro item da matriz ou cria upload avulso
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf'
            const fileName = `${savedClientId}/contrato-assinado-${Date.now()}.${fileExt}`
            await supabase.storage
              .from('documentos_adesao')
              .upload(fileName, file, { upsert: true })
          }
        } catch (docErr) {
          console.warn('Erro ao vincular arquivo à Documentação de Adesão:', docErr)
        }
      }

      toast.success(
        existingClient && duplicateResolution === 'link'
          ? 'Cliente atualizado com sucesso a partir do contrato!'
          : 'Cadastro do cliente criado com sucesso a partir do contrato!',
        {
          action: {
            label: 'Abrir Cadastro',
            onClick: () => {
              onSuccess(savedClientId)
            },
          },
        },
      )

      onOpenChange(false)
      onSuccess(savedClientId)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar cadastro do contrato: ' + (err.message || 'Falha desconhecida'))
      setStep('review')
    }
  }

  const renderFieldWithFallback = (
    label: string,
    value: string | number | null | undefined,
    component: React.ReactNode,
  ) => {
    const isUnidentified =
      value === null ||
      value === undefined ||
      value === '' ||
      (typeof value === 'number' && value === 0 && label !== 'Mensalidade Total')
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-700">{label}</Label>
          {isUnidentified && (
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
            >
              Não identificado no contrato
            </Badge>
          )}
        </div>
        {component}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-slate-50/60">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Importar Contrato Assinado
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {step === 'upload'
              ? 'Envie o contrato assinado em PDF para extrair módulos, valores e dados cadastrais.'
              : 'Conferência obrigatória: confira e ajuste os dados lidos antes de gravar o cadastro.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="p-6 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const dropped = e.dataTransfer.files?.[0]
                if (dropped) handleProcessPdf(dropped)
              }}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const sel = e.target.files?.[0]
                  if (sel) handleProcessPdf(sel)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              />
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Processando contrato assinado...
                    </p>
                    <p className="text-xs text-slate-500">
                      Extraindo cláusulas, plano, módulos, filiais e valores contratados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Clique para selecionar ou arraste o PDF do contrato assinado
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Formatos aceitos: PDF (máx. 25MB)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
              <span className="font-semibold block text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                Regras de Importação de Contrato:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li>
                  A mensalidade vem <strong>exatamente do que está informado no contrato</strong> e
                  nunca será recalculada automaticamente.
                </li>
                <li>
                  Uma <strong>tela de conferência obrigatória</strong> será exibida antes de
                  qualquer gravação.
                </li>
                <li>
                  Campos não identificados serão sinalizados explicitamente — nunca inventados.
                </li>
                <li>Se o CNPJ já existir na base, você poderá vincular ou criar novo cadastro.</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'review' && (
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* ALERTA DE CNPJ DUPLICADO */}
              {existingClient && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        CNPJ já existente na base de clientes!
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Encontrado o cliente{' '}
                        <strong className="text-amber-950">{existingClient.nome}</strong> (CNPJ:{' '}
                        {formatCNPJ(existingClient.cnpj) || existingClient.cnpj}).
                      </p>
                    </div>
                  </div>

                  <RadioGroup
                    value={duplicateResolution}
                    onValueChange={(val: any) => setDuplicateResolution(val)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1"
                  >
                    <div
                      className={cn(
                        'flex items-center space-x-2 border rounded-lg p-3 cursor-pointer bg-white transition-colors',
                        duplicateResolution === 'link'
                          ? 'border-indigo-600 ring-1 ring-indigo-600'
                          : 'border-slate-200',
                      )}
                      onClick={() => setDuplicateResolution('link')}
                    >
                      <RadioGroupItem value="link" id="res-link" />
                      <Label htmlFor="res-link" className="text-xs cursor-pointer font-medium">
                        <div>Vincular ao cliente existente</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          Atualiza plano, módulos e valor informados no contrato.
                        </div>
                      </Label>
                    </div>

                    <div
                      className={cn(
                        'flex items-center space-x-2 border rounded-lg p-3 cursor-pointer bg-white transition-colors',
                        duplicateResolution === 'create_new'
                          ? 'border-indigo-600 ring-1 ring-indigo-600'
                          : 'border-slate-200',
                      )}
                      onClick={() => setDuplicateResolution('create_new')}
                    >
                      <RadioGroupItem value="create_new" id="res-create" />
                      <Label htmlFor="res-create" className="text-xs cursor-pointer font-medium">
                        <div>Criar novo cadastro</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          Gera um novo registro mantendo o CNPJ duplicado.
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* CARD DE VALORES PRINCIPAIS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> Mensalidade Total (Contrato)
                    </span>
                    {!valorMensalidade && (
                      <Badge variant="outline" className="text-[9px] bg-white text-amber-700">
                        Não identificado
                      </Badge>
                    )}
                  </div>
                  <div className="text-xl font-bold text-emerald-900">
                    {formatCurrency(valorMensalidade)}
                  </div>
                  <p className="text-[10px] text-emerald-700">
                    Valor manual fixo informado no contrato assinado.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-indigo-700 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> Plano Base
                    </span>
                    {!planoBase && (
                      <Badge variant="outline" className="text-[9px] bg-white text-amber-700">
                        Não identificado
                      </Badge>
                    )}
                  </div>
                  <div className="text-xl font-bold text-indigo-900">
                    {planoBase || 'Não identificado'}
                  </div>
                  <p className="text-[10px] text-indigo-700">
                    Franquia principal de documentos TMS.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Data de Assinatura
                    </span>
                    {!dataAssinatura && (
                      <Badge variant="outline" className="text-[9px] bg-white text-amber-700">
                        Não identificado
                      </Badge>
                    )}
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {dataAssinatura
                      ? new Date(dataAssinatura + 'T00:00:00').toLocaleDateString('pt-BR')
                      : 'Não identificada'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {vigencia ? `Vigência: ${vigencia}` : 'Data formal do aceite'}
                  </p>
                </div>
              </div>

              {/* SEÇÃO 1: DADOS DA EMPRESA (CONTRATANTE) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Dados da Empresa (Contratante)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderFieldWithFallback(
                    'Razão Social',
                    nome,
                    <div className="relative">
                      <Input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Não identificado no contrato"
                        className={cn(!nome && 'border-amber-300 bg-amber-50/30')}
                      />
                      {isEnrichingCnpj && (
                        <div className="absolute right-2 top-2.5 flex items-center gap-1 text-[11px] text-indigo-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Consultando RF...
                        </div>
                      )}
                    </div>,
                  )}

                  {renderFieldWithFallback(
                    'CNPJ',
                    cnpj,
                    <Input
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      onBlur={handleManualCnpjBlur}
                      placeholder="00.000.000/0000-00"
                      className={cn(!cnpj && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}
                </div>

                {renderFieldWithFallback(
                  'Endereço da Sede',
                  endereco,
                  <Input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Não identificado no contrato"
                    className={cn(!endereco && 'border-amber-300 bg-amber-50/30')}
                  />,
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderFieldWithFallback(
                    'E-mail de Contato',
                    email,
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Não identificado no contrato"
                      className={cn(!email && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}

                  {renderFieldWithFallback(
                    'Telefone',
                    telefone,
                    <Input
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="Não identificado no contrato"
                      className={cn(!telefone && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}
                </div>
              </div>

              {/* SEÇÃO 2: REPRESENTANTE LEGAL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Representante Legal</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {renderFieldWithFallback(
                    'Nome do Representante',
                    repNome,
                    <Input
                      value={repNome}
                      onChange={(e) => setRepNome(e.target.value)}
                      placeholder="Não identificado no contrato"
                      className={cn(!repNome && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}

                  {renderFieldWithFallback(
                    'CPF do Representante',
                    repCpf,
                    <Input
                      value={repCpf}
                      onChange={(e) => setRepCpf(e.target.value)}
                      placeholder="Não identificado no contrato"
                      className={cn(!repCpf && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}

                  {renderFieldWithFallback(
                    'RG do Representante',
                    repRg,
                    <Input
                      value={repRg}
                      onChange={(e) => setRepRg(e.target.value)}
                      placeholder="Não identificado no contrato"
                      className={cn(!repRg && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}
                </div>
              </div>

              {/* SEÇÃO 3: PLANO E VALORES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Plano, Mensalidade e Condições Contratuais
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {renderFieldWithFallback(
                    'Plano Contratado',
                    planoBase,
                    <Input
                      value={planoBase}
                      onChange={(e) => setPlanoBase(e.target.value)}
                      placeholder="Ex: TMS-300"
                      className={cn(!planoBase && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}

                  {renderFieldWithFallback(
                    'Mensalidade Total (R$)',
                    valorMensalidade,
                    <Input
                      type="number"
                      step="0.01"
                      value={valorMensalidade || ''}
                      onChange={(e) => setValorMensalidade(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                    />,
                  )}

                  {renderFieldWithFallback(
                    'Implantação (R$)',
                    valorImplantacao,
                    <Input
                      type="number"
                      step="0.01"
                      value={valorImplantacao || ''}
                      onChange={(e) => setValorImplantacao(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                    />,
                  )}

                  {renderFieldWithFallback(
                    'Dia de Vencimento',
                    vencimentoMensal,
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={vencimentoMensal}
                      onChange={(e) =>
                        setVencimentoMensal(
                          e.target.value === '' ? '' : parseInt(e.target.value, 10),
                        )
                      }
                      placeholder="Não identificado"
                      className={cn(vencimentoMensal === '' && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderFieldWithFallback(
                    'Data de Assinatura',
                    dataAssinatura,
                    <Input
                      type="date"
                      value={dataAssinatura}
                      onChange={(e) => setDataAssinatura(e.target.value)}
                      className={cn(!dataAssinatura && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}

                  {renderFieldWithFallback(
                    'Vigência do Contrato',
                    vigencia,
                    <Input
                      value={vigencia}
                      onChange={(e) => setVigencia(e.target.value)}
                      placeholder="Não identificado no contrato"
                      className={cn(!vigencia && 'border-amber-300 bg-amber-50/30')}
                    />,
                  )}
                </div>
              </div>

              {/* SEÇÃO 4: MÓDULOS CONTRATADOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Módulos Contratados ({modulos.length})
                    </h3>
                  </div>
                  {modulos.length === 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                    >
                      Nenhum módulo identificado
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 min-h-[42px] p-2 bg-slate-50 border border-slate-200 rounded-lg items-center">
                  {modulos.length > 0 ? (
                    modulos.map((m) => {
                      const inCatalog = MODULES.some(
                        (cat) => cat.name.toLowerCase() === m.toLowerCase(),
                      )
                      return (
                        <Badge
                          key={m}
                          variant="secondary"
                          className={cn(
                            'pl-2.5 pr-1 py-1 text-xs flex items-center gap-1.5',
                            inCatalog
                              ? 'bg-white border-slate-300 text-slate-800'
                              : 'bg-purple-50 border-purple-200 text-purple-800',
                          )}
                        >
                          <span>{m}</span>
                          {!inCatalog && (
                            <span className="text-[9px] bg-purple-200/60 px-1 rounded text-purple-900">
                              Fora do catálogo
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(m)}
                            className="hover:text-red-600 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Nenhum módulo identificado no contrato. Adicione abaixo se necessário.
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar módulo (ex: BI WEB, SL-Trip, DF-e)..."
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddModule()
                      }
                    }}
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddModule}
                    disabled={!newModuleName.trim()}
                    className="h-9 gap-1 text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
              </div>

              {/* SEÇÃO 5: FILIAIS CITADAS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Filiais Citadas no Contrato ({filiais.length})
                    </h3>
                  </div>
                  {filiais.length === 0 && (
                    <Badge variant="outline" className="text-[10px] text-slate-500">
                      Nenhuma filial citada
                    </Badge>
                  )}
                </div>

                {filiais.length > 0 && (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {filiais.map((f, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">{f.nome}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{f.cnpj}</div>
                          {f.isenta && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] bg-emerald-50 text-emerald-700"
                            >
                              Isenta
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFilial(i)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Nome da filial"
                    value={newFilialNome}
                    onChange={(e) => setNewFilialNome(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Input
                    placeholder="CNPJ da filial"
                    value={newFilialCnpj}
                    onChange={(e) => setNewFilialCnpj(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFilial}
                    disabled={!newFilialCnpj.trim()}
                    className="h-9 gap-1 text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Filial
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="px-6 py-3 border-t bg-slate-50 shrink-0 flex items-center justify-between sm:justify-between">
          <div>
            {step === 'review' && file && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5 truncate max-w-xs">
                <FileText className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{file.name}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={step === 'saving'}
            >
              Cancelar
            </Button>

            {step === 'upload' ? (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Selecionar PDF
              </Button>
            ) : (
              <Button
                onClick={handleConfirmSave}
                disabled={step === 'saving'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
              >
                {step === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gravando Cadastro...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {existingClient && duplicateResolution === 'link'
                      ? 'Atualizar Cliente Existente'
                      : 'Confirmar e Criar Cadastro'}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
