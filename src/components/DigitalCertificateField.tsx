import { useState, useEffect, useCallback } from 'react'
import { KeyRound, Eye, EyeOff, Save, Loader2, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { encryptPassword, decryptPassword } from '@/lib/crypto'
import { updateDadosParametrizacao } from '@/services/implementacoes'

interface DigitalCertificateFieldProps {
  dadosParametrizacao: any | null
  implementacaoId: string
}

function parseDados(dados: any): Record<string, any> | null {
  if (!dados) return null
  if (typeof dados === 'string') {
    try {
      return JSON.parse(dados)
    } catch {
      return null
    }
  }
  if (typeof dados === 'object' && dados !== null) return dados
  return null
}

function extractRawPassword(dados: any): string | null {
  const parsed = parseDados(dados)
  if (!parsed) return null
  const value =
    parsed.senha_certificado_digital ?? parsed.certificado_senha ?? parsed.senha_certificado ?? null
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

export function DigitalCertificateField({
  dadosParametrizacao,
  implementacaoId,
}: DigitalCertificateFieldProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasExistingValue, setHasExistingValue] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const raw = extractRawPassword(dadosParametrizacao)
    setHasExistingValue(!!raw)
    if (raw) {
      decryptPassword(raw)
        .then((decrypted) => {
          setPassword(decrypted)
        })
        .catch(() => {
          setPassword('')
        })
    } else {
      setPassword('')
    }
    setIsDirty(false)
  }, [dadosParametrizacao])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setIsDirty(true)
  }

  const handleSave = useCallback(async () => {
    if (!password.trim()) {
      toast.error('A senha não pode estar vazia.')
      return
    }
    setIsSaving(true)
    try {
      const encrypted = await encryptPassword(password.trim())
      const parsed = parseDados(dadosParametrizacao) || {}
      const updatedDados: Record<string, any> = {
        ...parsed,
        senha_certificado_digital: encrypted,
      }
      delete updatedDados.certificado_senha
      delete updatedDados.senha_certificado

      await updateDadosParametrizacao(implementacaoId, updatedDados)
      setHasExistingValue(true)
      setIsDirty(false)
      toast.success('Senha atualizada com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao salvar senha: ' + (error.message || ''))
    } finally {
      setIsSaving(false)
    }
  }, [password, dadosParametrizacao, implementacaoId])

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
            Criptografado
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handleChange}
              placeholder={hasExistingValue ? '' : 'Não informado'}
              className="pl-9 pr-10 font-mono"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !password.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
            size="default"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Salvar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          A senha é criptografada (AES-256-GCM) antes de ser armazenada no banco de dados.
        </p>
      </CardContent>
    </Card>
  )
}
