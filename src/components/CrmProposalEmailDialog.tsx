import { useState, useEffect } from 'react'
import { Loader2, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

interface CrmProposalEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: any
  proposta: any
  onSuccess: (propostaId: string) => void
}

export function CrmProposalEmailDialog({
  open,
  onOpenChange,
  prospect,
  proposta,
  onSuccess,
}: CrmProposalEmailDialogProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && prospect && proposta) {
      setTo(prospect.email || '')
      setSubject(`Proposta Comercial – ${prospect.empresa}`)

      const contactName = proposta.aos_cuidados_de || prospect.contato_nome || 'Cliente'
      setMessage(`Prezado(a) ${contactName},

Espero que esteja bem.

Conforme alinhado em nossa conversa e apresentação do sistema, segue em anexo a sua proposta comercial com a solução mais adequada para a sua operação.

A cotação foi elaborada com base nas informações levantadas durante nosso atendimento e contempla as melhores condições disponíveis no momento.

Caso tenha qualquer dúvida ou precise de algum ajuste na proposta, estou à disposição para te auxiliar.

Fico no aguardo do seu retorno para darmos sequência.

Atenciosamente,
Comercial`)
    }
  }, [open, prospect, proposta])

  const handleSend = async () => {
    if (!to) {
      toast({
        title: 'Aviso',
        description: 'Informe o e-mail do destinatário.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const senderName = user?.user_metadata?.name || 'Comercial'

      const finalMessage = message.replace('Comercial', senderName)

      const { error } = await supabase.functions.invoke('send-crm-proposal', {
        body: {
          to,
          companyName: prospect.empresa,
          contactName: proposta.aos_cuidados_de || prospect.contato_nome,
          senderName,
          proposalId: proposta.id,
          proposalUrl: proposta.documento_url || prospect.proposta_url || undefined,
          subject,
          message: finalMessage,
        },
      })

      if (error) throw error

      toast({ title: 'E-mail enviado com sucesso!' })
      onSuccess(proposta.id)
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro ao enviar e-mail', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enviar Proposta por E-mail</DialogTitle>
          <DialogDescription>
            Revise as informações antes de enviar a proposta comercial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Destinatário (Para)</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@cliente.com.br"
            />
          </div>
          <div className="space-y-2">
            <Label>Assunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} />
          </div>
          {proposta?.documento_url ? (
            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-md border border-indigo-100">
              <FileText className="h-4 w-4" />
              <span className="truncate flex-1 font-medium">
                Proposta será anexada ao e-mail (PDF)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-100">
              <FileText className="h-4 w-4" />
              <span className="truncate flex-1 font-medium">
                Atenção: Esta proposta não possui arquivo PDF anexado.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Enviar E-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
