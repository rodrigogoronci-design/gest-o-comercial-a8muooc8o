import React, { useState } from 'react'
import {
  FileSpreadsheet,
  Upload,
  History,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Layers,
} from 'lucide-react'
import { UtilizationUpload } from '@/components/service-logic/UtilizationUpload'
import { UtilizationReview } from '@/components/service-logic/UtilizationReview'
import { UtilizationHistory } from '@/components/service-logic/UtilizationHistory'
import { commitUtilizationImport } from '@/services/service-logic-utilizacao'
import { SLPreImportAnalysis } from '@/types/service-logic-utilizacao'
import { useAuth } from '@/hooks/use-auth'
import { useUserRole } from '@/hooks/use-user-role'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { isUtilizacaoAllowed } from '@/lib/roles'

export default function ServiceLogicUtilizacaoPage() {
  const { user } = useAuth()
  const { role, loading: roleLoading, isFinancialRestricted } = useUserRole()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'importar' | 'historico'>('importar')
  const [currentAnalysis, setCurrentAnalysis] = useState<SLPreImportAnalysis | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = role === 'Admin'
  const isAuthorized = isUtilizacaoAllowed(role)

  if (roleLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <p className="text-sm text-slate-500">Verificando permissões de acesso...</p>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-12 max-w-lg space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Você não possui permissão para acessar o Módulo de Utilização Service Logic. Apenas
            perfis Administrador, Gestor e Colaborador têm acesso autorizado.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleAnalysisReady = (analysis: SLPreImportAnalysis) => {
    setCurrentAnalysis(analysis)
  }

  const handleCancelReview = () => {
    setCurrentAnalysis(null)
  }

  const handleConfirmImport = async (motivoReimportacao?: string, observacao?: string) => {
    if (!currentAnalysis || !user) return

    if (!isAdmin) {
      toast({
        title: 'Permissão negada',
        description:
          'Somente administradores têm permissão para importar ou substituir competências de utilização.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await commitUtilizationImport({
        analysis: currentAnalysis,
        motivoReimportacao,
        observacao,
        userId: user.id,
      })

      if (result.success) {
        toast({
          title: 'Importação concluída com sucesso!',
          description: `Competência ${currentAnalysis.competenciaConfirmada} gravada com integridade.`,
        })
        setCurrentAnalysis(null)
        setActiveTab('historico')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao gravar importação',
        description: err.message || 'Falha na comunicação com o banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Top Banner / Cabeçalho do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Módulo de Utilização Service Logic
            </h1>
            <Badge className="bg-indigo-600 text-white font-medium text-xs">
              Fase 1 — Importação & Conferência
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Importação segura de planilhas XLSX, validação de volumetria, auditoria por competência
            e cruzamento de CNPJ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs py-1"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Perfil Administrador (Importação Autorizada)
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-300 text-xs py-1"
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Perfil de Consulta (Visualização)
            </Badge>
          )}
        </div>
      </div>

      {/* Aviso caso usuário não seja Admin na aba de Importação */}
      {!isAdmin && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-sm font-semibold">Acesso em Modo Leitura</AlertTitle>
          <AlertDescription className="text-xs">
            Seu usuário possui permissão apenas para consultar o histórico de importações e
            conferências de utilização. O envio e substituição de planilhas é restrito a
            Administradores.
          </AlertDescription>
        </Alert>
      )}

      {/* Navegação principal */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1">
          <TabsTrigger
            value="importar"
            className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs"
          >
            <Upload className="h-4 w-4 mr-2" />
            Nova Importação
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs"
          >
            <History className="h-4 w-4 mr-2" />
            Histórico & Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Fluxo de Importação / Conferência */}
        <TabsContent value="importar" className="space-y-6 pt-4">
          {currentAnalysis ? (
            <UtilizationReview
              analysis={currentAnalysis}
              onConfirmImport={handleConfirmImport}
              onCancel={handleCancelReview}
              isSubmitting={isSubmitting}
            />
          ) : (
            <UtilizationUpload onAnalysisReady={handleAnalysisReady} disabled={!isAdmin} />
          )}
        </TabsContent>

        {/* Tab 2: Histórico e Auditoria */}
        <TabsContent value="historico" className="pt-4">
          <UtilizationHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
