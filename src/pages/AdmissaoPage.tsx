import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Upload,
  FileText,
  Save,
  Send,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Circle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Lock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  fetchAdesaoByToken,
  saveAdesaoProgresso,
  uploadAdesaoArquivo,
  deleteAdesaoArquivo,
  type AdesaoPublicData,
  type AdesaoArquivoItem,
} from '@/services/adesao-onboarding'
import {
  FICHA_OFICIAL_SECOES,
  UPLOAD_ITEM_MAPPING,
  type FichaSecaoDef,
} from '@/config/ficha-adesao'

export default function AdmissaoPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdesaoPublicData | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [arquivos, setArquivos] = useState<Record<string, AdesaoArquivoItem>>({})
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)
  const [savingProgress, setSavingProgress] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeSecao, setActiveSecao] = useState<string>('matriz')

  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  // Carregar dados da ficha
  const loadData = async () => {
    if (!token) {
      setData({ valid: false, reason: 'not_found' })
      setLoading(false)
      return
    }

    try {
      const res = await fetchAdesaoByToken(token)
      setData(res)

      if (res.valid) {
        const initialForm = { ...(res.respostas || {}) }
        // Pre-popula dados conhecidos se ainda vazios
        if (!initialForm.pf_nome && res.cliente_nome) initialForm.pf_nome = ''
        if (!initialForm.pf_email && res.cliente_email) initialForm.pf_email = res.cliente_email
        if (!initialForm.pf_telefone && res.cliente_telefone)
          initialForm.pf_telefone = res.cliente_telefone
        if (!initialForm.rl_telefone && res.cliente_telefone)
          initialForm.rl_telefone = res.cliente_telefone

        // Perfil Operacional default Sim/Não
        if (initialForm.op_transportadora === undefined) initialForm.op_transportadora = true
        if (initialForm.op_agenciadora === undefined) initialForm.op_agenciadora = false
        if (initialForm.possui_filial === undefined) initialForm.possui_filial = false
        if (initialForm.cert_sefaz_habilitada === undefined)
          initialForm.cert_sefaz_habilitada = true

        setFormData(initialForm)

        // Mapeia arquivos existentes por item_chave
        const arqMap: Record<string, AdesaoArquivoItem> = {}
        if (Array.isArray(res.arquivos)) {
          res.arquivos.forEach((a) => {
            arqMap[a.item_chave] = a
          })
        }
        setArquivos(arqMap)

        if (res.status_submissao === 'enviado') {
          setSubmittedSuccess(true)
        }
      }
    } catch (err: any) {
      toast.error('Erro ao carregar admissão: ' + (err.message || ''))
      setData({ valid: false, reason: 'not_found' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // Upload individual de arquivo
  const handleFileUpload = async (itemChave: string, file: File) => {
    if (!data?.link_id) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo excede o limite máximo de 20MB')
      return
    }

    setUploadingItem(itemChave)
    try {
      const saved = await uploadAdesaoArquivo({
        linkId: data.link_id,
        clienteId: data.cliente_id,
        itemChave,
        file,
      })
      setArquivos((prev) => ({ ...prev, [itemChave]: saved }))
      toast.success(`Arquivo para "${saved.item_label}" enviado com sucesso!`)
    } catch (err: any) {
      toast.error('Falha no upload: ' + (err.message || ''))
    } finally {
      setUploadingItem(null)
      if (fileInputsRef.current[itemChave]) {
        fileInputsRef.current[itemChave]!.value = ''
      }
    }
  }

  const handleDeleteFile = async (itemChave: string) => {
    if (!data?.link_id) return
    try {
      await deleteAdesaoArquivo(data.link_id, itemChave)
      setArquivos((prev) => {
        const next = { ...prev }
        delete next[itemChave]
        return next
      })
      toast.success('Arquivo removido.')
    } catch (err: any) {
      toast.error('Erro ao remover: ' + (err.message || ''))
    }
  }

  // Salvar progresso
  const handleSaveProgress = async (showToast: boolean = true) => {
    if (!token) return
    setSavingProgress(true)
    try {
      await saveAdesaoProgresso(token, formData, false)
      if (showToast) {
        toast.success('Progresso salvo com sucesso! Você pode continuar a qualquer momento.')
      }
    } catch (err: any) {
      toast.error('Erro ao salvar progresso: ' + (err.message || ''))
    } finally {
      setSavingProgress(false)
    }
  }

  // Calcular itens pendentes e validação geral
  const checkPendencias = () => {
    const pendencias: { campo: string; secao: string; tipo: 'campo' | 'arquivo' }[] = []

    // 1. Matriz
    if (!arquivos.matriz_cartao_cnpj) {
      pendencias.push({ campo: 'Cartão CNPJ (Matriz)', secao: 'EMPRESA (Matriz)', tipo: 'arquivo' })
    }
    if (!arquivos.matriz_contrato_social) {
      pendencias.push({ campo: 'Contrato Social', secao: 'EMPRESA (Matriz)', tipo: 'arquivo' })
    }
    if (!formData.matriz_regime_tributario) {
      pendencias.push({ campo: 'Regime Tributário', secao: 'EMPRESA (Matriz)', tipo: 'campo' })
    }

    // 2. Filial (se possui filial = true)
    if (formData.possui_filial) {
      if (!arquivos.filial_cartao_cnpj) {
        pendencias.push({ campo: 'Cartão CNPJ da Filial', secao: 'FILIAL', tipo: 'arquivo' })
      }
      if (!formData.filial_incidencia_tributaria) {
        pendencias.push({
          campo: 'Incidência Tributária da Filial',
          secao: 'FILIAL',
          tipo: 'campo',
        })
      }
      if (!formData.filial_contador_nome) {
        pendencias.push({ campo: 'Nome do Contador', secao: 'FILIAL', tipo: 'campo' })
      }
      if (!formData.filial_inscricao_estadual) {
        pendencias.push({ campo: 'Inscrição Estadual da Filial', secao: 'FILIAL', tipo: 'campo' })
      }
    }

    // 3. Certificado Digital
    if (!arquivos.cert_arquivo) {
      pendencias.push({
        campo: 'Arquivo do Certificado Digital A1',
        secao: 'CERTIFICADO DIGITAL',
        tipo: 'arquivo',
      })
    }
    if (!formData.cert_senha) {
      pendencias.push({
        campo: 'Senha do Certificado Digital',
        secao: 'CERTIFICADO DIGITAL',
        tipo: 'campo',
      })
    }
    if (formData.cert_sefaz_habilitada === undefined) {
      pendencias.push({
        campo: 'Confirmação de Habilitação na SEFAZ',
        secao: 'CERTIFICADO DIGITAL',
        tipo: 'campo',
      })
    }

    // 4. Perfil Operacional
    if (!formData.op_regiao_localizacao?.trim()) {
      pendencias.push({
        campo: 'Região de localização',
        secao: 'PERFIL OPERACIONAL',
        tipo: 'campo',
      })
    }
    if (!formData.op_regiao_atuacao?.trim()) {
      pendencias.push({ campo: 'Região de atuação', secao: 'PERFIL OPERACIONAL', tipo: 'campo' })
    }
    if (!formData.op_segmento?.trim()) {
      pendencias.push({
        campo: 'Segmento a ser transportado',
        secao: 'PERFIL OPERACIONAL',
        tipo: 'campo',
      })
    }

    // 5. Identidade Visual
    if (!arquivos.id_logomarca) {
      pendencias.push({
        campo: 'Logomarca da empresa',
        secao: 'IDENTIDADE VISUAL',
        tipo: 'arquivo',
      })
    }

    // 6. Responsável Legal
    if (!formData.rl_nome?.trim()) {
      pendencias.push({
        campo: 'Nome do responsável legal',
        secao: 'RESPONSÁVEL LEGAL',
        tipo: 'campo',
      })
    }
    if (!arquivos.rl_cnh) {
      pendencias.push({
        campo: 'Cópia da CNH do responsável',
        secao: 'RESPONSÁVEL LEGAL',
        tipo: 'arquivo',
      })
    }
    if (!formData.rl_telefone?.trim()) {
      pendencias.push({
        campo: 'Telefone do responsável legal',
        secao: 'RESPONSÁVEL LEGAL',
        tipo: 'campo',
      })
    }

    // 7. Contatos
    if (!formData.pf_nome?.trim() || !formData.pf_email?.trim() || !formData.pf_telefone?.trim()) {
      pendencias.push({
        campo: 'Ponto Focal do Projeto completo',
        secao: 'CONTATOS DO PROJETO',
        tipo: 'campo',
      })
    }
    if (!formData.ro_nome?.trim() || !formData.ro_email?.trim() || !formData.ro_telefone?.trim()) {
      pendencias.push({
        campo: 'Responsável Operacional completo',
        secao: 'CONTATOS DO PROJETO',
        tipo: 'campo',
      })
    }
    if (!formData.rf_nome?.trim() || !formData.rf_email?.trim() || !formData.rf_telefone?.trim()) {
      pendencias.push({
        campo: 'Responsável Financeiro completo',
        secao: 'CONTATOS DO PROJETO',
        tipo: 'campo',
      })
    }

    return pendencias
  }

  const pendencias = checkPendencias()
  const totalUploadsEsperados = 5 + (formData.possui_filial ? 1 : 0)
  const totalUploadsRecebidos = Object.keys(arquivos).length

  // Submissão final
  const handleSubmit = async () => {
    if (!token) return

    if (pendencias.length > 0) {
      toast.error(
        `Existem ${pendencias.length} item(ns) pendente(s). Revise a lista de pendências antes de enviar.`,
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await saveAdesaoProgresso(token, formData, true)
      if (res.success) {
        setSubmittedSuccess(true)
        toast.success('Ficha cadastral e documentos enviados com sucesso!')
      } else {
        toast.error(res.error || 'Erro ao finalizar envio.')
      }
    } catch (err: any) {
      toast.error('Erro na submissão: ' + (err.message || ''))
    } finally {
      setSubmitting(false)
    }
  }

  // 1. Tela de Carregando
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-base font-semibold text-slate-800">
              Carregando Ficha de Adesão...
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Validando token e carregando dados cadastrais.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 2. Tela de Link Inválido, Expirado ou Revogado
  if (!data || !data.valid) {
    const isExpirado = data?.reason === 'expirado'
    const isRevogado = data?.reason === 'revogado'

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {isExpirado
                ? 'Link de Adesão Expirado'
                : isRevogado
                  ? 'Link de Adesão Revogado'
                  : 'Link Não Encontrado ou Inválido'}
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 pt-2">
              {isExpirado
                ? 'A data limite para preenchimento desta ficha foi atingida.'
                : isRevogado
                  ? 'Este link foi substituído por uma nova via ou cancelado pelo comercial.'
                  : 'O link acessado não existe ou não está mais ativo.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-center">
            <div className="p-4 bg-slate-100 rounded-lg text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Como proceder?</p>
              <p>
                Solicite ao consultor comercial responsável pela sua conta a geração de um novo link
                de adesão atualizado.
              </p>
            </div>
            <div className="pt-2 text-xs text-slate-400">
              Service Logic Soluções em Tecnologia • Tel: (27) 2141-0107 • www.servicelogic.com.br
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 3. Tela de Confirmação de Envio (Sucesso)
  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl shadow-2xl border-emerald-100">
          <CardHeader className="text-center pb-4 pt-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <Badge className="mx-auto mb-2 bg-emerald-100 text-emerald-800 border-emerald-200">
              Ficha de Adesão Concluída
            </Badge>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Obrigado, {data.cliente_nome || 'Cliente'}!
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 pt-2 max-w-md mx-auto">
              Recebemos com sucesso as informações cadastrais e toda a documentação da empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2 pb-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Empresa:</span>
                <span className="font-semibold text-slate-900">{data.cliente_nome}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Documentos anexados:</span>
                <span className="font-semibold text-indigo-700">
                  {totalUploadsRecebidos} arquivo(s)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Status do processo:</span>
                <span className="font-semibold text-emerald-700">
                  Em conferência pela equipe de Implantação
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Próximo passo:</span>
                <span className="font-semibold text-slate-800">
                  Agendamento da reunião de alinhamento e parametrização
                </span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 space-y-1">
              <p>Nossa equipe comercial e técnica entrará em contato com o Ponto Focal indicado.</p>
              <p className="font-medium text-slate-700">
                Dúvidas? Entre em contato pelo telefone (27) 2141-0107 ou pelo WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 4. Formulário Principal
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Cabeçalho Oficial Service Logic */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-xs">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-sm">
                  SERVICE LOGIC
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200"
                >
                  Ficha de Adesão Oficial
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                INFORMAÇÕES E DOCUMENTOS NECESSÁRIOS PARA ADMISSÃO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveProgress(true)}
              disabled={savingProgress}
              className="text-xs h-8 gap-1.5"
            >
              {savingProgress ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Salvar Progresso
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 gap-1.5 font-medium"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Enviar Ficha
            </Button>
          </div>
        </div>
      </header>

      {/* Banner de Boas-vindas e Identificação do Cliente */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold text-orange-400 tracking-wider">
                Portal de Admissão de Cliente
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {data.cliente_nome || 'Prezado Cliente'}
              </h1>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3 pt-1">
                {data.cliente_cnpj && <span>CNPJ: {data.cliente_cnpj}</span>}
                {data.expira_em && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <Clock className="h-3 w-3" />
                    Válido até {new Date(data.expira_em).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 text-xs space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Documentos anexados:</span>
                <span className="font-semibold text-white">
                  {totalUploadsRecebidos} de {totalUploadsEsperados}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Pendências:</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px]',
                    pendencias.length === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/30',
                  )}
                >
                  {pendencias.length === 0 ? 'Tudo pronto!' : `${pendencias.length} pendente(s)`}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Box de Pendências (alerta amigável) */}
      {pendencias.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Itens pendentes para conclusão do envio:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pl-6">
              {pendencias.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="truncate">
                    <strong>{p.secao}:</strong> {p.campo}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-amber-700 italic pl-6 pt-1">
              Você pode salvar o progresso a qualquer momento e retornar mais tarde pelo mesmo link.
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo em Duas Colunas: Navegação por seções e Formulário */}
      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu Lateral de Seções */}
        <aside className="lg:col-span-1 space-y-2">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs sticky top-20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">
              Seções da Ficha
            </span>
            <nav className="space-y-1">
              {FICHA_OFICIAL_SECOES.map((secao) => {
                const isActive = activeSecao === secao.id
                return (
                  <button
                    key={secao.id}
                    onClick={() => {
                      setActiveSecao(secao.id)
                      const el = document.getElementById(`secao-${secao.id}`)
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={cn(
                      'w-full text-left text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <span className="truncate">{secao.title}</span>
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        isActive ? 'text-indigo-600' : 'text-slate-400',
                      )}
                    />
                  </button>
                )
              })}
            </nav>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-700 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Dados protegidos por criptografia</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Seus dados serão gravados com segurança na nuvem Service Logic.
              </p>
            </div>
          </div>
        </aside>

        {/* Formulário Principal com as Seções */}
        <main className="lg:col-span-3 space-y-6">
          {FICHA_OFICIAL_SECOES.map((secao) => (
            <Card
              key={secao.id}
              id={`secao-${secao.id}`}
              className="border-slate-200 shadow-sm bg-white scroll-mt-24"
            >
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      {secao.title}
                    </CardTitle>
                    {secao.description && (
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        {secao.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {secao.id === 'contatos' ? (
                  // Tabela / Blocos dos Contatos (Ponto Focal, Operacional, Financeiro)
                  <div className="space-y-6">
                    {/* Bloco 1: Ponto Focal */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Ponto Focal do Projeto <span className="text-red-500">*</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome *</Label>
                          <Input
                            placeholder="Nome completo"
                            className="h-8 text-xs bg-white"
                            value={formData.pf_nome || ''}
                            onChange={(e) => handleInputChange('pf_nome', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">E-mail *</Label>
                          <Input
                            type="email"
                            placeholder="email@empresa.com.br"
                            className="h-8 text-xs bg-white"
                            value={formData.pf_email || ''}
                            onChange={(e) => handleInputChange('pf_email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Telefone *</Label>
                          <Input
                            placeholder="(00) 00000-0000"
                            className="h-8 text-xs bg-white"
                            value={formData.pf_telefone || ''}
                            onChange={(e) => handleInputChange('pf_telefone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Responsável Operacional */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Responsável Operacional <span className="text-red-500">*</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome *</Label>
                          <Input
                            placeholder="Nome completo"
                            className="h-8 text-xs bg-white"
                            value={formData.ro_nome || ''}
                            onChange={(e) => handleInputChange('ro_nome', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">E-mail *</Label>
                          <Input
                            type="email"
                            placeholder="operacional@empresa.com.br"
                            className="h-8 text-xs bg-white"
                            value={formData.ro_email || ''}
                            onChange={(e) => handleInputChange('ro_email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Telefone *</Label>
                          <Input
                            placeholder="(00) 00000-0000"
                            className="h-8 text-xs bg-white"
                            value={formData.ro_telefone || ''}
                            onChange={(e) => handleInputChange('ro_telefone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloco 3: Responsável Financeiro */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Responsável Financeiro <span className="text-red-500">*</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome *</Label>
                          <Input
                            placeholder="Nome completo"
                            className="h-8 text-xs bg-white"
                            value={formData.rf_nome || ''}
                            onChange={(e) => handleInputChange('rf_nome', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">E-mail *</Label>
                          <Input
                            type="email"
                            placeholder="financeiro@empresa.com.br"
                            className="h-8 text-xs bg-white"
                            value={formData.rf_email || ''}
                            onChange={(e) => handleInputChange('rf_email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Telefone *</Label>
                          <Input
                            placeholder="(00) 00000-0000"
                            className="h-8 text-xs bg-white"
                            value={formData.rf_telefone || ''}
                            onChange={(e) => handleInputChange('rf_telefone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Campos padrões da seção
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {secao.campos.map((campo) => {
                      // Se a seção for filial e possui_filial for false, oculta campos secundários de filial
                      if (
                        secao.id === 'filial' &&
                        campo.key !== 'possui_filial' &&
                        !formData.possui_filial
                      ) {
                        return null
                      }

                      // Renderização de campo tipo FILE
                      if (campo.type === 'file') {
                        const fileItem = arquivos[campo.key]
                        const isUploading = uploadingItem === campo.key

                        return (
                          <div
                            key={campo.key}
                            className={cn(
                              'p-4 rounded-xl border transition-colors space-y-2',
                              fileItem
                                ? 'bg-emerald-50/30 border-emerald-200'
                                : 'bg-slate-50/60 border-slate-200',
                              campo.key === 'id_logomarca' || campo.key === 'cert_arquivo'
                                ? 'sm:col-span-2'
                                : '',
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                {fileItem ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5 text-indigo-600" />
                                )}
                                {campo.label}
                                {campo.required && <span className="text-red-500">*</span>}
                              </Label>
                              {fileItem ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                  Anexado
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-700 bg-amber-50 border-amber-200"
                                >
                                  Pendente
                                </Badge>
                              )}
                            </div>

                            {campo.helperText && (
                              <p className="text-[11px] text-slate-500">{campo.helperText}</p>
                            )}

                            {fileItem ? (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                                <a
                                  href={fileItem.public_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1.5 truncate max-w-[280px]"
                                >
                                  <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                                  <span className="truncate">{fileItem.file_name}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteFile(campo.key)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    title="Remover arquivo"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <input
                                  ref={(el) => {
                                    fileInputsRef.current[campo.key] = el
                                  }}
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileUpload(campo.key, file)
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isUploading}
                                  onClick={() => fileInputsRef.current[campo.key]?.click()}
                                  className="w-full text-xs h-9 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 gap-2"
                                >
                                  {isUploading ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                                      Enviando arquivo...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-3.5 w-3.5 text-indigo-600" />
                                      Selecionar Arquivo
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      }

                      // Renderização de campo BOOLEAN (Sim/Não)
                      if (campo.type === 'boolean') {
                        const val = formData[campo.key] ?? false

                        return (
                          <div
                            key={campo.key}
                            className={cn(
                              'p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2',
                              campo.key === 'possui_filial' || campo.key === 'cert_sefaz_habilitada'
                                ? 'sm:col-span-2'
                                : '',
                            )}
                          >
                            <Label className="text-xs font-semibold text-slate-800 block">
                              {campo.label}
                              {campo.required && <span className="text-red-500 ml-0.5">*</span>}
                            </Label>
                            {campo.helperText && (
                              <p className="text-[11px] text-slate-500">{campo.helperText}</p>
                            )}
                            <RadioGroup
                              value={val ? 'sim' : 'nao'}
                              onValueChange={(v) => handleInputChange(campo.key, v === 'sim')}
                              className="flex items-center gap-6 pt-1"
                            >
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem value="sim" id={`${campo.key}-sim`} />
                                <Label
                                  htmlFor={`${campo.key}-sim`}
                                  className="text-xs cursor-pointer font-medium"
                                >
                                  Sim
                                </Label>
                              </div>
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem value="nao" id={`${campo.key}-nao`} />
                                <Label
                                  htmlFor={`${campo.key}-nao`}
                                  className="text-xs cursor-pointer font-medium"
                                >
                                  Não
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )
                      }

                      // Renderização de campo SELECT
                      if (campo.type === 'select') {
                        return (
                          <div key={campo.key} className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-800">
                              {campo.label}
                              {campo.required && <span className="text-red-500 ml-0.5">*</span>}
                            </Label>
                            <Select
                              value={formData[campo.key] || ''}
                              onValueChange={(v) => handleInputChange(campo.key, v)}
                            >
                              <SelectTrigger className="h-9 text-xs bg-white">
                                <SelectValue placeholder={campo.placeholder || 'Selecione'} />
                              </SelectTrigger>
                              <SelectContent>
                                {campo.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {campo.helperText && (
                              <p className="text-[11px] text-slate-400">{campo.helperText}</p>
                            )}
                          </div>
                        )
                      }

                      // Renderização de campo PASSWORD (Senha sensível de Certificado)
                      if (campo.type === 'password') {
                        return (
                          <div key={campo.key} className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                              <span>
                                {campo.label}
                                {campo.required && <span className="text-red-500 ml-0.5">*</span>}
                              </span>
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Campo estritamente protegido
                              </span>
                            </Label>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={campo.placeholder}
                                className="h-9 text-xs bg-white pr-10"
                                value={formData[campo.key] || ''}
                                onChange={(e) => handleInputChange(campo.key, e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            {campo.helperText && (
                              <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200">
                                {campo.helperText}
                              </p>
                            )}
                          </div>
                        )
                      }

                      // Renderização de campo TEXT padrão
                      return (
                        <div
                          key={campo.key}
                          className={cn(
                            'space-y-1.5',
                            campo.key === 'op_segmento' ||
                              campo.key === 'op_regiao_atuacao' ||
                              campo.key === 'filial_regime_nfse_detalhes'
                              ? 'sm:col-span-2'
                              : '',
                          )}
                        >
                          <Label className="text-xs font-semibold text-slate-800">
                            {campo.label}
                            {campo.required && <span className="text-red-500 ml-0.5">*</span>}
                          </Label>
                          <Input
                            placeholder={campo.placeholder}
                            className="h-9 text-xs bg-white"
                            value={formData[campo.key] || ''}
                            onChange={(e) => handleInputChange(campo.key, e.target.value)}
                          />
                          {campo.helperText && (
                            <p className="text-[11px] text-slate-400">{campo.helperText}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Barra de Ações Inferior */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {pendencias.length === 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Todos os campos e arquivos obrigatórios estão
                  preenchidos!
                </span>
              ) : (
                <span>
                  Ainda restam <strong className="text-amber-700">{pendencias.length}</strong>{' '}
                  item(ns) pendente(s).
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveProgress(true)}
                disabled={savingProgress}
                className="flex-1 sm:flex-none text-xs h-9 gap-1.5"
              >
                {savingProgress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Progresso
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 sm:flex-none text-xs h-9 bg-indigo-600 hover:bg-indigo-700 font-semibold gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Finalizar e Enviar Ficha
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Rodapé Oficial com dados da Service Logic */}
      <footer className="max-w-6xl mx-auto px-4 pt-12 text-center text-xs text-slate-400 space-y-1">
        <p className="font-medium text-slate-600">
          Service Logic Soluções em Tecnologia – Av. Central, 1439, Sala 201, Ed. Comercial Santa
          Clara, Laranjeiras, Serra - ES.
        </p>
        <p>Telefone: (27) 2141-0107 • www.servicelogic.com.br</p>
      </footer>
    </div>
  )
}
