import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import {
  Check,
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { supabase } from '@/lib/supabase/client'
import { parseModulosToList } from '@/lib/modules-parser'
import { TagsInput } from '@/components/TagsInput'

const STEPS = ['Identificação', 'Detalhes Técnicos', 'Documentos', 'Revisão']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.docx']

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [implData, setImplData] = useState<any>(null)
  const [invalid, setInvalid] = useState(false)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({
    contato_nome: '',
    contato_telefone: '',
    contato_email: '',
    observacoes: '',
    modulos_adicionais: [] as string[],
    tipo_treinamento: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) {
      setInvalid(true)
      setLoading(false)
      return
    }
    supabase.rpc('get_implementacao_onboarding', { p_token: token }).then(({ data, error }) => {
      if (error || !data) {
        setInvalid(true)
      } else {
        const rawData = data as any
        setImplData(rawData)
        const existingParam = rawData?.dados_parametrizacao || {}
        const existingOnboarding = existingParam.onboarding
        const rawModulos = existingParam.modulos_adicionais || rawData?.modulos_novos || []
        setForm({
          contato_nome: existingOnboarding?.contato_nome || '',
          contato_telefone: existingOnboarding?.contato_telefone || '',
          contato_email: existingOnboarding?.contato_email || '',
          observacoes: existingOnboarding?.observacoes || '',
          modulos_adicionais: Array.isArray(rawModulos) ? rawModulos : [],
          tipo_treinamento: existingParam.tipo_treinamento || '',
        })
      }
      setLoading(false)
    })
  }, [token])

  const modules = implData ? parseModulosToList(implData.modulos) : []

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const valid = Array.from(list).filter((f) => {
      const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '')
      return ACCEPTED_EXT.includes(ext) && f.size <= MAX_FILE_SIZE
    })
    setFiles((prev) => [...prev, ...valid])
  }

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const canProceed =
    step === 0
      ? !!(form.contato_nome.trim() && form.contato_telefone.trim() && form.contato_email.trim())
      : true

  const handleSubmit = async () => {
    if (!token || !implData) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const arquivos: any[] = []
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${implData.id}/onboarding/${Date.now()}-${safeName}`
        const { error: upErr } = await supabase.storage
          .from('implementation-docs')
          .upload(filePath, file, { upsert: false })
        if (upErr) throw new Error(`Erro ao enviar arquivo "${file.name}"`)
        arquivos.push({
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        })
      }
      const { data, error } = await supabase.rpc('submit_onboarding', {
        p_token: token,
        p_data: {
          onboarding: {
            contato_nome: form.contato_nome,
            contato_telefone: form.contato_telefone,
            contato_email: form.contato_email,
            observacoes: form.observacoes,
            submitted_at: new Date().toISOString(),
          },
          modulos_adicionais: form.modulos_adicionais,
          tipo_treinamento: form.tipo_treinamento,
        },
        p_arquivos: arquivos,
      })
      if (error) throw new Error('Erro ao enviar dados')
      if (data) setSuccess(true)
      else setInvalid(true)
    } catch (e: any) {
      setSubmitError(e.message || 'Erro ao enviar ficha. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <PageShell>
        <Card className="shadow-xl">
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500">Carregando ficha de implantação...</p>
          </CardContent>
        </Card>
      </PageShell>
    )

  if (invalid)
    return (
      <PageShell>
        <Card className="shadow-xl">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">Link expirado ou inválido</p>
            <p className="text-sm text-muted-foreground mt-1">
              Este link pode ter expirado ou a ficha já foi preenchida. Entre em contato com o
              responsável pela implantação.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    )

  if (success)
    return (
      <PageShell>
        <Card className="shadow-xl">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-slate-700">Ficha enviada com sucesso!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Recebemos seus dados e arquivos. Nossa equipe entrará em contato em breve.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    )

  return (
    <PageShell>
      <Card className="shadow-xl border-slate-200/80">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h1 className="text-lg font-bold text-slate-800">Ficha de Implantação</h1>
            </div>
            <p className="text-sm text-slate-500">
              {STEPS[step]} — Etapa {step + 1} de {STEPS.length}
            </p>
          </div>

          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                <p className="text-sm text-indigo-800 font-medium">
                  Bem-vindo(a) ao processo de implantação!
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Precisamos que você preencha alguns dados para iniciarmos a configuração do seu
                  sistema. É rápido e fácil!
                </p>
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input value={implData?.cliente_nome || ''} readOnly className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={implData?.cliente_cnpj || ''} readOnly className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label>Nome do responsável *</Label>
                <Input
                  value={form.contato_nome}
                  onChange={(e) => setForm({ ...form, contato_nome: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={form.contato_telefone}
                  onChange={(e) => setForm({ ...form, contato_telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={form.contato_email}
                  onChange={(e) => setForm({ ...form, contato_email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Input
                  value={implData?.plano_descricao || 'Não definido'}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Franquia</Label>
                <Input
                  value={
                    implData?.franquia_quantidade != null
                      ? `${implData.franquia_quantidade} beneficiários`
                      : 'Não definida'
                  }
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Módulos Contratados</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-md min-h-[44px]">
                  {modules.length > 0 ? (
                    modules.map((m, i) => (
                      <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700">
                        {m}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nenhum módulo cadastrado</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Módulos Adicionais</Label>
                <TagsInput
                  value={form.modulos_adicionais}
                  onChange={(v) => setForm({ ...form, modulos_adicionais: v })}
                  placeholder="Adicionar módulo..."
                />
                <p className="text-xs text-slate-400">
                  Adicione módulos extras que não estão no plano contratado.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Treinamento</Label>
                <RadioGroup
                  value={form.tipo_treinamento}
                  onValueChange={(v) => setForm({ ...form, tipo_treinamento: v })}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="Remoto" id="tipo-treinamento-remoto" />
                    <Label htmlFor="tipo-treinamento-remoto" className="text-sm cursor-pointer">
                      Remoto
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="Presencial" id="tipo-treinamento-presencial" />
                    <Label htmlFor="tipo-treinamento-presencial" className="text-sm cursor-pointer">
                      Presencial
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Alguma observação sobre a implantação?"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Documentos</Label>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Clique para selecionar arquivos
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX • Máx 10MB cada</p>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-md border border-slate-200"
                      >
                        <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="text-sm flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-slate-400">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          onClick={() => removeFile(i)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-md bg-slate-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Empresa</span>
                  <span className="text-sm font-medium">{implData?.cliente_nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Responsável</span>
                  <span className="text-sm font-medium">{form.contato_nome || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Telefone</span>
                  <span className="text-sm font-medium">{form.contato_telefone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">E-mail</span>
                  <span className="text-sm font-medium">{form.contato_email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Plano</span>
                  <span className="text-sm font-medium">{implData?.plano_descricao || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Arquivos</span>
                  <span className="text-sm font-medium">{files.length} arquivo(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Tipo de Treinamento</span>
                  <span className="text-sm font-medium">{form.tipo_treinamento || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Módulos Adicionais</span>
                  <span className="text-sm font-medium">
                    {form.modulos_adicionais.length > 0
                      ? form.modulos_adicionais.join(', ')
                      : 'Nenhum'}
                  </span>
                </div>
              </div>
              {form.observacoes && (
                <div className="p-3 rounded-md bg-slate-50">
                  <span className="text-xs text-slate-500">Observações</span>
                  <p className="text-sm mt-1">{form.observacoes}</p>
                </div>
              )}
              {submitError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                {submitting ? 'Enviando...' : 'Enviar Ficha'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
