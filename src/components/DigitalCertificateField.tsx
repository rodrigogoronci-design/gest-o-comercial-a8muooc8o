import { KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'

interface DigitalCertificateFieldProps {
  dadosParametrizacao: any | null
}

function extractCertificatePassword(dados: any | null): string | null {
  if (!dados) return null
  if (typeof dados === 'string') {
    try {
      dados = JSON.parse(dados)
    } catch {
      return null
    }
  }
  if (typeof dados !== 'object' || dados === null) return null
  const value = dados.certificado_senha ?? dados.senha_certificado ?? null
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

export function DigitalCertificateField({ dadosParametrizacao }: DigitalCertificateFieldProps) {
  const password = extractCertificatePassword(dadosParametrizacao)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-5 w-5 text-indigo-600" />
          Senha do Certificado Digital
          <Badge
            variant="secondary"
            className="ml-auto text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Somente leitura
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <KeyRound className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-sm font-mono font-medium text-slate-800 break-all">
            {password ?? 'Não informado'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
