import { useState, useEffect } from 'react'
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Building,
  User,
  Phone,
  Mail,
  Truck,
  FileCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getAdesaoRespostasForClient,
  type AdesaoArquivoItem,
  type AdesaoLink,
} from '@/services/adesao-onboarding'
import { FICHA_OFICIAL_SECOES } from '@/config/ficha-adesao'

interface AdesaoFichaRespostasViewerProps {
  clienteId: string
  refreshTrigger?: number
}

export function AdesaoFichaRespostasViewer({
  clienteId,
  refreshTrigger = 0,
}: AdesaoFichaRespostasViewerProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    resposta: any | null
    arquivos: AdesaoArquivoItem[]
    link: AdesaoLink | null
  }>({ resposta: null, arquivos: [], link: null })

  const [showMaskedPassword, setShowMaskedPassword] = useState(false)

  const loadRespostas = async () => {
    setLoading(true)
    try {
      const res = await getAdesaoRespostasForClient(clienteId)
      setData(res)
    } catch (err) {
      console.error('Erro ao buscar respostas da adesão:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRespostas()
  }, [clienteId, refreshTrigger])

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-6 text-center text-xs text-slate-500">
          Carregando dados da ficha de adesão...
        </CardContent>
      </Card>
    )
  }

  const { resposta, arquivos, link } = data
  const fichaDados = resposta?.ficha_dados || {}
  const arqMap: Record<string, AdesaoArquivoItem> = {}
  arquivos.forEach((a) => {
    arqMap[a.item_chave] = a
  })

  // Se não houver link ou resposta
  if (!link && !resposta) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-6 text-center text-xs text-slate-400">
          Nenhuma submissão de ficha de adesão registrada para este cliente.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-indigo-600" />
              Ficha de Adesão Preenchida pelo Cliente
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Respostas cadastradas online e conferência de itens recebidos.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {resposta?.status_submissao === 'enviado' ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ficha Concluída e Enviada
              </Badge>
            ) : resposta ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px] gap-1">
                <AlertCircle className="h-3 w-3" /> Preenchimento em Progresso
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500 text-[11px]">
                Aguardando Acesso do Cliente
              </Badge>
            )}
            {resposta?.enviado_em && (
              <span className="text-[11px] text-slate-400">
                {new Date(resposta.enviado_em).toLocaleDateString('pt-BR')} às{' '}
                {new Date(resposta.enviado_em).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6 text-xs">
        {/* Seção 1: Matriz */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
            <Building className="h-4 w-4 text-indigo-600" />
            <span>EMPRESA (Matriz)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Regime Tributário:</span>
              <span className="font-semibold text-slate-900">
                {fichaDados.matriz_regime_tributario || 'Não informado'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Cartão CNPJ:</span>
              {arqMap.matriz_cartao_cnpj ? (
                <a
                  href={arqMap.matriz_cartao_cnpj.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" /> Ver Cartão CNPJ{' '}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-amber-600 font-medium">Pendente</span>
              )}
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Contrato Social:</span>
              {arqMap.matriz_contrato_social ? (
                <a
                  href={arqMap.matriz_contrato_social.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" /> Ver Contrato Social{' '}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-amber-600 font-medium">Pendente</span>
              )}
            </div>
          </div>
        </div>

        {/* Seção 2: Filial */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
            <Building className="h-4 w-4 text-indigo-600" />
            <span>FILIAL</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Possui filial?</span>
              <span className="font-semibold text-slate-900">
                {fichaDados.possui_filial ? 'Sim' : 'Não'}
              </span>
            </div>
            {fichaDados.possui_filial && (
              <>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Inscrição Estadual:</span>
                  <span className="font-semibold text-slate-900">
                    {fichaDados.filial_inscricao_estadual || '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Contador:</span>
                  <span className="font-semibold text-slate-900">
                    {fichaDados.filial_contador_nome || '-'} (CRC:{' '}
                    {fichaDados.filial_contador_crc || '-'})
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Seção 3: Certificado Digital & SEFAZ */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>CERTIFICADO DIGITAL / SEFAZ</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Arquivo do Certificado:</span>
              {arqMap.cert_arquivo ? (
                <a
                  href={arqMap.cert_arquivo.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" /> Baixar Certificado A1{' '}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-amber-600 font-medium">Pendente</span>
              )}
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Senha do Certificado:</span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-mono font-semibold text-slate-900">
                  {showMaskedPassword ? fichaDados.cert_senha || '(não informada)' : '••••••••••••'}
                </span>
                {fichaDados.cert_senha && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMaskedPassword((p) => !p)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                    title={showMaskedPassword ? 'Ocultar' : 'Exibir temporariamente'}
                  >
                    {showMaskedPassword ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Habilitada SEFAZ:</span>
              <span className="font-semibold text-slate-900">
                {fichaDados.cert_sefaz_habilitada ? 'Sim, habilitada' : 'Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Seção 4: Perfil Operacional */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
            <Truck className="h-4 w-4 text-indigo-600" />
            <span>PERFIL OPERACIONAL & IDENTIDADE VISUAL</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">
                Transportadora / Agenciadora:
              </span>
              <span className="font-semibold text-slate-900">
                Transp: {fichaDados.op_transportadora ? 'Sim' : 'Não'} | Agenc:{' '}
                {fichaDados.op_agenciadora ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Região de Atuação:</span>
              <span className="font-semibold text-slate-900">
                {fichaDados.op_regiao_atuacao || '-'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Segmento Transportado:</span>
              <span className="font-semibold text-slate-900">{fichaDados.op_segmento || '-'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Logomarca:</span>
              {arqMap.id_logomarca ? (
                <a
                  href={arqMap.id_logomarca.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" /> Ver Logo <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-amber-600 font-medium">Pendente</span>
              )}
            </div>
          </div>
        </div>

        {/* Seção 5: Responsável Legal & Contatos */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
            <User className="h-4 w-4 text-indigo-600" />
            <span>RESPONSÁVEL LEGAL & CONTATOS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">Responsável Legal</span>
              <p className="text-slate-600">Nome: {fichaDados.rl_nome || '-'}</p>
              <p className="text-slate-600">Tel: {fichaDados.rl_telefone || '-'}</p>
              {arqMap.rl_cnh && (
                <a
                  href={arqMap.rl_cnh.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-semibold text-[11px] flex items-center gap-1 pt-1"
                >
                  <FileText className="h-3 w-3" /> Cópia CNH{' '}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">Ponto Focal do Projeto</span>
              <p className="text-slate-600">Nome: {fichaDados.pf_nome || '-'}</p>
              <p className="text-slate-600">E-mail: {fichaDados.pf_email || '-'}</p>
              <p className="text-slate-600">Tel: {fichaDados.pf_telefone || '-'}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">Financeiro / Operacional</span>
              <p className="text-slate-600">
                Fin: {fichaDados.rf_nome || '-'} ({fichaDados.rf_email || '-'})
              </p>
              <p className="text-slate-600">
                Oper: {fichaDados.ro_nome || '-'} ({fichaDados.ro_email || '-'})
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
