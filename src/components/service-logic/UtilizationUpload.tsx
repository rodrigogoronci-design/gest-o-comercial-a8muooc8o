import React, { useState } from 'react'
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText,
  HelpCircle,
  Clock,
  Edit2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  calculateFileSHA256,
  extractCompetenciaFromFileName,
  analyzeSpreadsheet,
  checkFileHashExists,
  checkCompetenciaExists,
} from '@/services/service-logic-utilizacao'
import { SLImportacao, SLPreImportAnalysis } from '@/types/service-logic-utilizacao'
import { useToast } from '@/hooks/use-toast'

interface UtilizationUploadProps {
  onAnalysisReady: (analysis: SLPreImportAnalysis) => void
  disabled?: boolean
}

export const UtilizationUpload: React.FC<UtilizationUploadProps> = ({
  onAnalysisReady,
  disabled = false,
}) => {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [fileHash, setFileHash] = useState<string>('')
  const [competenciaIdentificada, setCompetenciaIdentificada] = useState<string>('')
  const [competenciaConfirmada, setCompetenciaConfirmada] = useState<string>('')
  const [isEditingCompetencia, setIsEditingCompetencia] = useState(false)
  const [tempCompetencia, setTempCompetencia] = useState('')

  const [loading, setLoading] = useState(false)
  const [hashDuplicateWarning, setHashDuplicateWarning] = useState<SLImportacao | null>(null)
  const [competenciaDuplicateWarning, setCompetenciaDuplicateWarning] =
    useState<SLImportacao | null>(null)
  const [showHashJustificationDialog, setShowHashJustificationDialog] = useState(false)
  const [hashJustification, setHashJustification] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setLoading(true)
    setHashDuplicateWarning(null)
    setCompetenciaDuplicateWarning(null)

    try {
      // 1. Calcular Hash SHA-256
      const hash = await calculateFileSHA256(selected)
      setFileHash(hash)

      // 2. Identificar competência pelo nome do arquivo (sugestão inicial)
      const compSug = extractCompetenciaFromFileName(selected.name)
      setCompetenciaIdentificada(compSug)
      setCompetenciaConfirmada(compSug)
      setTempCompetencia(compSug)

      // 3. Verificar duplicidade de hash no banco
      const existingHash = await checkFileHashExists(hash)
      if (existingHash) {
        setHashDuplicateWarning(existingHash)
      }

      // 4. Verificar duplicidade de competência no banco
      const existingComp = await checkCompetenciaExists(compSug)
      if (existingComp) {
        setCompetenciaDuplicateWarning(existingComp)
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao examinar arquivo',
        description: err.message || 'Não foi possível ler o arquivo XLSX selecionado.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCustomCompetencia = async () => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(tempCompetencia)) {
      toast({
        title: 'Formato inválido',
        description: 'A competência deve estar no formato AAAA-MM (Ex: 2025-01).',
        variant: 'destructive',
      })
      return
    }

    setCompetenciaConfirmada(tempCompetencia)
    setIsEditingCompetencia(false)

    // Reavaliar competência no banco
    const existingComp = await checkCompetenciaExists(tempCompetencia)
    setCompetenciaDuplicateWarning(existingComp)
  }

  const handleStartAnalysis = async () => {
    if (!file) return

    // Se hash já existe e usuário ainda não confirmou justificativa
    if (hashDuplicateWarning && !hashJustification.trim()) {
      setShowHashJustificationDialog(true)
      return
    }

    setLoading(true)
    try {
      const analysis = await analyzeSpreadsheet(file, competenciaConfirmada)
      toast({
        title: 'Planilha processada',
        description: `${analysis.linhasValidas} linhas válidas prontas para conferência.`,
      })
      onAnalysisReady(analysis)
    } catch (err: any) {
      toast({
        title: 'Falha na validação',
        description: err.message || 'Ocorreu um erro ao processar a planilha.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
          <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
          Upload de Arquivo de Utilização (Service Logic)
        </CardTitle>
        <CardDescription>
          Envie o arquivo XLSX de fechamento de utilização mensal. O sistema calcula o checksum
          SHA-256, identifica a competência e cruza os CNPJs com a base de clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input de arquivo */}
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-indigo-600" />
            </div>
            <Label
              htmlFor="xlsx-upload"
              className="font-semibold text-slate-800 text-base cursor-pointer hover:underline"
            >
              {file ? 'Trocar arquivo selecionado' : 'Clique para selecionar o arquivo XLSX'}
            </Label>
            <p className="text-xs text-slate-500 mt-1">Formatos suportados: .xlsx, .xls</p>
            <Input
              id="xlsx-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading || disabled}
              className="hidden"
            />
          </div>
        </div>

        {file && (
          <div className="space-y-4 pt-2">
            {/* Informações do Arquivo e Checksum */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-100/70 rounded-lg text-sm border border-slate-200">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-500 block">
                  Arquivo
                </span>
                <span className="font-medium text-slate-800 break-all flex items-center gap-1.5 mt-0.5">
                  <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                  {file.name}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-500 block">
                  Checksum SHA-256
                </span>
                <span
                  className="font-mono text-xs text-slate-700 break-all bg-white p-1 rounded border block mt-0.5"
                  title={fileHash}
                >
                  {fileHash || 'Calculando...'}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-500 block">
                  Competência Confirmada
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-sm font-semibold bg-white text-indigo-700 border-indigo-200"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {competenciaConfirmada || 'Não identificada'}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      setTempCompetencia(competenciaConfirmada)
                      setIsEditingCompetencia(true)
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Corrigir
                  </Button>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Sugerida pelo nome do arquivo: <strong>{competenciaIdentificada}</strong>
                </span>
              </div>
            </div>

            {/* Alerta de Hash Duplicado */}
            {hashDuplicateWarning && (
              <Alert className="border-amber-300 bg-amber-50/80 text-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="font-bold flex items-center justify-between">
                  <span>Atenção: Este mesmo arquivo já foi importado anteriormente!</span>
                  <Badge
                    variant="outline"
                    className="border-amber-400 bg-amber-100 text-amber-800 text-xs"
                  >
                    Hash IDêntico
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-xs space-y-1.5 mt-1">
                  <p>
                    O checksum SHA-256 deste arquivo corresponde à importação realizada em{' '}
                    <strong>
                      {new Date(hashDuplicateWarning.created_at).toLocaleString('pt-BR')}
                    </strong>{' '}
                    (Competência: <strong>{hashDuplicateWarning.competencia}</strong>, Total:{' '}
                    <strong>{hashDuplicateWarning.total_linhas}</strong> linhas).
                  </p>
                  <p className="font-medium text-amber-950">
                    Para evitar duplicações acidentais, o prosseguimento exige confirmação com
                    justificativa.
                  </p>
                  {hashJustification && (
                    <div className="p-2 bg-white/80 rounded border border-amber-200 text-xs mt-2">
                      <span className="font-semibold block text-slate-700">
                        Justificativa informada:
                      </span>
                      <p className="italic text-slate-600">{hashJustification}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Alerta de Competência Já Existente (Reimportação Segura) */}
            {competenciaDuplicateWarning && !hashDuplicateWarning && (
              <Alert className="border-blue-300 bg-blue-50/70 text-blue-900">
                <Clock className="h-5 w-5 text-blue-600" />
                <AlertTitle className="font-bold">
                  Competência {competenciaConfirmada} já possui importação gravada
                </AlertTitle>
                <AlertDescription className="text-xs space-y-1 mt-1">
                  <p>
                    Já existe uma importação ativa para a competência{' '}
                    <strong>{competenciaConfirmada}</strong> gravada em{' '}
                    {new Date(competenciaDuplicateWarning.created_at).toLocaleString('pt-BR')}.
                  </p>
                  <p className="font-medium text-blue-950">
                    Ao confirmar, esta nova planilha substituirá a competência vigente (marcando os
                    registros anteriores como <code>vigente = false</code> e gerando log de
                    auditoria em <code>sl_historico_revisoes</code>).
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Botão de Avançar para Conferência */}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6"
                onClick={handleStartAnalysis}
                disabled={loading || !competenciaConfirmada || disabled}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando Planilha...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Avançar para Conferência Pré-Gravação
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal para Corrigir Competência */}
      <Dialog open={isEditingCompetencia} onOpenChange={setIsEditingCompetencia}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Corrigir Competência
            </DialogTitle>
            <DialogDescription>
              Informe o mês e ano de referência no formato <strong>AAAA-MM</strong> (Exemplo:
              2025-05).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="comp-input">Competência (AAAA-MM)</Label>
              <Input
                id="comp-input"
                placeholder="2025-05"
                maxLength={7}
                value={tempCompetencia}
                onChange={(e) => setTempCompetencia(e.target.value.trim())}
              />
              <span className="text-xs text-slate-500">
                A competência define o fechamento mensal da utilização e a vigência no histórico.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCompetencia(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleApplyCustomCompetencia}
            >
              Confirmar Competência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Justificativa de Hash Repetido */}
      <Dialog open={showHashJustificationDialog} onOpenChange={setShowHashJustificationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Justificativa de Importação Duplicada
            </DialogTitle>
            <DialogDescription>
              Este arquivo XLSX possui exatamente o mesmo checksum de uma importação anterior. Para
              continuar, informe o motivo desta reimportação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="just-hash">Motivo / Justificativa (Obrigatório)</Label>
            <Textarea
              id="just-hash"
              placeholder="Ex: Reenvio autorizado para reprocessamento de logs ou teste de conferência..."
              rows={3}
              value={hashJustification}
              onChange={(e) => setHashJustification(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHashJustificationDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!hashJustification.trim()}
              onClick={() => {
                setShowHashJustificationDialog(false)
                handleStartAnalysis()
              }}
            >
              Continuar com Justificativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
