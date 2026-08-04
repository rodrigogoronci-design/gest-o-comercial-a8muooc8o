import { useState, useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import {
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
} from 'lucide-react'
import logoUrl from '@/assets/logomarca-service-ea011.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase/client'
import {
  CONSULTORIA_DOC_CATEGORIES,
  CONSULTORIA_AREAS,
  CONSULTORIA_DEFAULT_TITULO,
  CONSULTORIA_DEFAULT_TEXTO,
  createInitialConsultoriaForm,
} from '@/lib/consultoria-config'

const STEPS = ['Dados da Empresa', 'Contatos', 'Documentação', 'Operacional & Revisão']

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  )
}

export default function ConsultoriaFormPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [implData, setImplData] = useState<any>(null)
  const [invalid, setInvalid] = useState(false)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState<Record<string, any>>(createInitialConsultoriaForm())

  useEffect(() => {
    if (!token) {
      setInvalid(true)
      setLoading(false)
      return
    }
    supabase.rpc('get_consultoria_form', { p_token: token }).then(({ data, error }) => {
      if (error || !data) {
        setInvalid(true)
      } else {
        setImplData(data)
      }
      setLoading(false)
    })
  }, [token])

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const toggleDoc = (item: string) => {
    setForm((prev) => {
      const docs: string[] = prev.documentacao || []
      return {
        ...prev,
        documentacao: docs.includes(item) ? docs.filter((d) => d !== item) : [...docs, item],
      }
    })
  }

  const canProceed =
    step === 0
      ? !!(form.empresa_razao_social?.trim() && form.legal_nome?.trim() && form.legal_email?.trim())
      : true

  const handleSubmit = async () => {
    if (!token) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const { data, error } = await supabase.rpc('submit_consultoria_form', {
        p_token: token,
        p_data: form,
      })
      if (error) throw new Error('Erro ao enviar dados')
      if (data) setSuccess(true)
      else setInvalid(true)
    } catch (e: any) {
      setSubmitError(e.message || 'Erro ao enviar formulário. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <PageShell>
        <Card className="shadow-xl">
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500">Carregando formulário...</p>
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
              Este link pode ter expirado ou o formulário já foi preenchido. Entre em contato com o
              responsável pela consultoria.
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
            <p className="text-lg font-medium text-slate-700">Formulário enviado com sucesso!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Recebemos suas informações. Nossa equipe entrará em contato em breve.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    )

  const titulo = implData?.consultoria_titulo || CONSULTORIA_DEFAULT_TITULO
  const texto = implData?.consultoria_texto || CONSULTORIA_DEFAULT_TEXTO

  return (
    <PageShell>
      <Card className="shadow-xl border-slate-200/80">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <img
                src={logoUrl}
                alt="Service Logic"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-amber-600" />
              <h1 className="text-lg font-bold text-slate-800">Formulário de Início do Projeto</h1>
            </div>
            <p className="text-sm font-medium text-slate-700">{titulo}</p>
            <p className="text-sm text-amber-600">
              Service Logic | {implData?.cliente_nome || 'Cliente'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {STEPS[step]} — Etapa {step + 1} de {STEPS.length}
            </p>
          </div>

          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{texto}</p>
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input
                  value={form.empresa_razao_social}
                  onChange={(e) => update('empresa_razao_social', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={form.empresa_nome_fantasia}
                    onChange={(e) => update('empresa_nome_fantasia', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={implData?.cliente_cnpj || ''} readOnly className="bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={form.empresa_inscricao_estadual}
                    onChange={(e) => update('empresa_inscricao_estadual', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Municipal</Label>
                  <Input
                    value={form.empresa_inscricao_municipal}
                    onChange={(e) => update('empresa_inscricao_municipal', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço Completo</Label>
                <Input
                  value={form.empresa_endereco}
                  onChange={(e) => update('empresa_endereco', e.target.value)}
                />
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-slate-700 mb-3">Responsável Legal</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={form.legal_nome}
                      onChange={(e) => update('legal_nome', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      value={form.legal_cargo}
                      onChange={(e) => update('legal_cargo', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input
                      value={form.legal_cpf}
                      onChange={(e) => update('legal_cpf', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={form.legal_telefone}
                      onChange={(e) => update('legal_telefone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-3">
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={form.legal_email}
                    onChange={(e) => update('legal_email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-slate-700 mb-3">Ponto Focal do Projeto</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={form.focal_nome}
                      onChange={(e) => update('focal_nome', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      value={form.focal_cargo}
                      onChange={(e) => update('focal_cargo', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Input
                      value={form.focal_departamento}
                      onChange={(e) => update('focal_departamento', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={form.focal_telefone}
                      onChange={(e) => update('focal_telefone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-3">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.focal_email}
                    onChange={(e) => update('focal_email', e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-slate-700 mb-3">Responsáveis por Área</p>
                <div className="space-y-3">
                  {CONSULTORIA_AREAS.map((area) => (
                    <div
                      key={area.key}
                      className="space-y-2 p-3 rounded-lg border border-slate-200"
                    >
                      <p className="text-xs font-semibold text-slate-500 uppercase">{area.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nome"
                          value={form[`area_${area.key}_nome`] || ''}
                          onChange={(e) => update(`area_${area.key}_nome`, e.target.value)}
                        />
                        <Input
                          placeholder="Cargo"
                          value={form[`area_${area.key}_cargo`] || ''}
                          onChange={(e) => update(`area_${area.key}_cargo`, e.target.value)}
                        />
                        <Input
                          placeholder="E-mail"
                          value={form[`area_${area.key}_email`] || ''}
                          onChange={(e) => update(`area_${area.key}_email`, e.target.value)}
                        />
                        <Input
                          placeholder="Telefone"
                          value={form[`area_${area.key}_telefone`] || ''}
                          onChange={(e) => update(`area_${area.key}_telefone`, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-slate-600">
                Solicitamos, sempre que disponível, o envio dos seguintes documentos:
              </p>
              {CONSULTORIA_DOC_CATEGORIES.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{cat.category}</p>
                  {cat.items.map((item) => {
                    const checked = (form.documentacao || []).includes(item)
                    return (
                      <div key={item} className="flex items-center gap-2">
                        <Checkbox checked={checked} onCheckedChange={() => toggleDoc(item)} />
                        <Label className="text-sm cursor-pointer">{item}</Label>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Informações Operacionais
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Volume médio mensal de transportes</Label>
                    <Input
                      value={form.op_volume_medio}
                      onChange={(e) => update('op_volume_medio', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de carga transportada</Label>
                    <Input
                      value={form.op_tipo_carga}
                      onChange={(e) => update('op_tipo_carga', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de veículo utilizado</Label>
                    <Input
                      value={form.op_tipo_veiculo}
                      onChange={(e) => update('op_tipo_veiculo', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modalidade da operação</Label>
                    <Input
                      value={form.op_modalidade}
                      onChange={(e) => update('op_modalidade', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Principais origens e destinos</Label>
                    <Input
                      value={form.op_origens_destinos}
                      onChange={(e) => update('op_origens_destinos', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fluxo previsto para CT-e e MDF-e</Label>
                    <Input
                      value={form.op_fluxo_cte_mdfe}
                      onChange={(e) => update('op_fluxo_cte_mdfe', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => update('observacoes', e.target.value)}
                  placeholder="Informações adicionais relevantes para a consultoria..."
                  rows={4}
                />
              </div>
              <div className="p-3 rounded-md bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700">
                  <strong>Prazo para envio:</strong> Solicitamos, se possível, o envio das
                  informações e documentos em até 5 dias úteis, para que possamos dar sequência ao
                  cronograma da consultoria e iniciar as análises previstas.
                </p>
              </div>
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
                className="bg-amber-600 hover:bg-amber-700"
              >
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                {submitting ? 'Enviando...' : 'Enviar Formulário'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
