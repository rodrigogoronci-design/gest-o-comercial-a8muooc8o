import { useState, useEffect } from 'react'
import {
  Link as LinkIcon,
  Copy,
  MessageCircle,
  RefreshCw,
  Ban,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import {
  getLatestAdesaoLink,
  createOrRegenerateAdesaoLink,
  revokeAdesaoLink,
  buildAdmissaoUrl,
  generateAdmissaoWhatsappMessage,
  type AdesaoLink,
} from '@/services/adesao-onboarding'

interface AdesaoLinkManagerCardProps {
  clienteId?: string | null
  prospectId?: string | null
  propostaId?: string | null
  clientName: string
  telefone?: string | null
  title?: string
  description?: string
  initialAutoOpenGenerate?: boolean
  onLinkCreated?: (link: AdesaoLink) => void
}

export function AdesaoLinkManagerCard({
  clienteId,
  prospectId,
  propostaId,
  clientName,
  telefone,
  title = 'Link de Adesão do Cliente',
  description = 'Gere e gerencie o link exclusivo da ficha cadastral e upload de documentos.',
  initialAutoOpenGenerate = false,
  onLinkCreated,
}: AdesaoLinkManagerCardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [link, setLink] = useState<AdesaoLink | null>(null)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(initialAutoOpenGenerate)
  const [diasValidade, setDiasValidade] = useState(30)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const loadLink = async () => {
    setLoading(true)
    try {
      const existing = await getLatestAdesaoLink(clienteId, prospectId)
      setLink(existing)
    } catch (err: any) {
      console.error('Erro ao carregar link de adesão:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLink()
  }, [clienteId, prospectId])

  const handleGenerate = async () => {
    if (diasValidade < 1 || diasValidade > 365) {
      toast.error('A validade deve ser entre 1 e 365 dias.')
      return
    }

    setGenerating(true)
    try {
      const newLink = await createOrRegenerateAdesaoLink({
        clienteId,
        prospectId,
        propostaId,
        diasValidade,
        criadoPorId: user?.id || null,
        criadoPorNome: user?.user_metadata?.name || user?.email || null,
      })
      setLink(newLink)
      setIsGenerateDialogOpen(false)
      onLinkCreated?.(newLink)
      toast.success(
        link
          ? 'Novo link de adesão gerado! O anterior foi revogado.'
          : 'Link de adesão gerado com sucesso!',
      )
    } catch (err: any) {
      toast.error('Erro ao gerar link: ' + (err.message || ''))
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async () => {
    if (!link) return
    setRevoking(true)
    try {
      await revokeAdesaoLink(link.id)
      setLink((prev) => (prev ? { ...prev, status: 'revogado' } : null))
      toast.success('Link revogado. O cliente não conseguirá mais acessá-lo.')
    } catch (err: any) {
      toast.error('Erro ao revogar link: ' + (err.message || ''))
    } finally {
      setRevoking(false)
    }
  }

  const fullUrl = link ? buildAdmissaoUrl(link.token) : ''

  const handleCopyLink = () => {
    if (!fullUrl) return
    navigator.clipboard.writeText(fullUrl)
    toast.success('Link de adesão copiado para a área de transferência!')
  }

  const handleCopyWhatsappMessage = () => {
    if (!fullUrl) return
    const msg = generateAdmissaoWhatsappMessage({
      clientName,
      linkUrl: fullUrl,
      diasValidade: link?.dias_validade || 30,
    })
    navigator.clipboard.writeText(msg)
    toast.success('Mensagem pronta para WhatsApp copiada com sucesso!')
  }

  const isExpired = link && new Date(link.expira_em) <= new Date()
  const isRevoked = link?.status === 'revogado'
  const isConcluido = link?.status === 'concluido'
  const isAtivo = link?.status === 'ativo' && !isExpired

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-indigo-600" /> {title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              {description}
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setIsGenerateDialogOpen(true)}
            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 gap-1.5 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {link ? 'Regenerar Link' : 'Gerar Link de Adesão'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 text-xs space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Consultando status do link...</span>
          </div>
        ) : !link ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-slate-600 font-medium">Nenhum link de adesão gerado ainda.</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Clique em &quot;Gerar Link de Adesão&quot; para criar o token seguro com data de
              validade e obter a mensagem pronta para envio ao cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Linha com Status e Validade */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Status do link:</span>
                {isAtivo ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                    Ativo
                  </Badge>
                ) : isConcluido ? (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]">
                    Ficha Enviada pelo Cliente
                  </Badge>
                ) : isRevoked ? (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px]">
                    Revogado / Cancelado
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                    Expirado
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Validade: <strong>{new Date(link.expira_em).toLocaleDateString('pt-BR')}</strong>{' '}
                  ({link.dias_validade} dias)
                </span>
              </div>
            </div>

            {/* Input com Link e Ações */}
            <div className="space-y-1.5">
              <Label className="text-slate-600 text-xs font-medium">
                Link do Portal do Cliente:
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={fullUrl}
                    readOnly
                    className="h-8 text-xs font-mono bg-slate-50 border-slate-200 pr-8 select-all"
                  />
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 top-2 text-slate-400 hover:text-indigo-600"
                    title="Abrir página pública"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 text-xs gap-1.5 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar Link
                </Button>
              </div>
            </div>

            {/* Ações: Copiar WhatsApp e Revogar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="default"
                size="sm"
                onClick={handleCopyWhatsappMessage}
                disabled={!isAtivo}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Copiar Mensagem Pronta p/ WhatsApp
              </Button>

              {isAtivo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs gap-1"
                >
                  {revoking ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Ban className="h-3 w-3" />
                  )}
                  Revogar Link
                </Button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * O envio é manual: copie o link ou a mensagem pronta e encaminhe via WhatsApp ao
              cliente. O sistema não realiza disparos automáticos.
            </p>
          </div>
        )}
      </CardContent>

      {/* Dialog para gerar ou regenerar o link */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <LinkIcon className="h-5 w-5 text-indigo-600" />
              {link ? 'Regenerar Link de Adesão' : 'Gerar Link de Adesão'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure a data de validade para o link exclusivo de{' '}
              <strong>{clientName || 'Cliente'}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {link && isAtivo && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Atenção: ao gerar um novo link, o token anterior será automaticamente{' '}
                  <strong>revogado</strong> e deixará de funcionar.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dias-validade" className="text-xs font-semibold text-slate-700">
                Dias de validade do link:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="dias-validade"
                  type="number"
                  min={1}
                  max={365}
                  value={diasValidade}
                  onChange={(e) => setDiasValidade(Number(e.target.value))}
                  className="h-9 text-xs"
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  Expira em:{' '}
                  {new Date(
                    Date.now() + (diasValidade || 0) * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                {[7, 15, 30, 60].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDiasValidade(d)}
                    className={cn(
                      'text-[11px] h-7 px-2.5',
                      diasValidade === d && 'bg-indigo-50 text-indigo-700 border-indigo-300',
                    )}
                  >
                    {d} dias
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateDialogOpen(false)}
              disabled={generating}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generating || diasValidade < 1}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-1.5"
            >
              {generating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {link ? 'Confirmar e Regenerar' : 'Gerar Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
