import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  FileCheck,
  RefreshCw,
  PlusCircle,
  Equal,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  HelpCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import { SLPreImportAnalysis, SLParsedRow } from '@/types/service-logic-utilizacao'

interface UtilizationReviewProps {
  analysis: SLPreImportAnalysis
  onConfirmImport: (motivoReimportacao?: string, observacao?: string) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export const UtilizationReview: React.FC<UtilizationReviewProps> = ({
  analysis,
  onConfirmImport,
  onCancel,
  isSubmitting = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'novas' | 'identicas' | 'diferentes' | 'divergencia' | 'nao_vinculados' | 'multiplos'
  >('all')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [motivoReimportacao, setMotivoReimportacao] = useState('')
  const [observacaoGeral, setObservacaoGeral] = useState('')

  const isReimportacao = analysis.competenciaJaExiste || analysis.hashJaExiste

  // Filtro de linhas
  const filteredRows = analysis.rows.filter((row) => {
    const matchesSearch =
      row.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.cnpjRaw.includes(searchTerm) ||
      row.cnpjNormalized.includes(searchTerm) ||
      (row.clienteNome && row.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.base && row.base.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (statusFilter === 'novas') return row.statusComparacao === 'novo'
    if (statusFilter === 'identicas') return row.statusComparacao === 'identico'
    if (statusFilter === 'diferentes') return row.statusComparacao === 'diferente'
    if (statusFilter === 'divergencia') return row.divergenciaFormula
    if (statusFilter === 'nao_vinculados') return !row.clienteId
    if (statusFilter === 'multiplos') return row.isMultiplo

    return true
  })

  const handleFinalSubmit = async () => {
    if (isReimportacao && !motivoReimportacao.trim()) {
      return
    }
    await onConfirmImport(motivoReimportacao, observacaoGeral)
    setShowConfirmModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header Resumo da Conferência */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/40 text-xs uppercase tracking-wider">
                  Conferência Pré-Gravação
                </Badge>
                <Badge className="bg-white/20 text-white border-none text-xs">
                  Competência: {analysis.competenciaConfirmada}
                </Badge>
                {isReimportacao && (
                  <Badge variant="destructive" className="bg-amber-600 text-white text-xs">
                    Substituição de Competência Ativa
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Painel de Validação & Auditoria Service Logic
              </CardTitle>
              <CardDescription className="text-slate-300">
                Arquivo: <span className="font-mono text-white">{analysis.fileName}</span> (SHA-256:{' '}
                <span className="font-mono text-xs text-indigo-200">
                  {analysis.fileHash.slice(0, 16)}...
                </span>
                )
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-slate-800 bg-white hover:bg-slate-100"
                onClick={onCancel}
              >
                Voltar / Cancelar
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={() => setShowConfirmModal(true)}
                disabled={analysis.linhasValidas === 0 || isSubmitting}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isReimportacao ? 'Confirmar Substituição Segura' : 'Gravar Utilização no Banco'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de Métricas e Contadores Obrigatórios */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block uppercase">
            Linhas Válidas
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1 flex items-baseline justify-between">
            {analysis.linhasValidas}
            <span className="text-xs text-slate-400 font-normal">/ {analysis.totalLinhas}</span>
          </div>
        </Card>

        <Card className="p-3 bg-blue-50/50 border-blue-200 shadow-xs">
          <span className="text-[11px] font-medium text-blue-700 block uppercase">
            Linhas Novas
          </span>
          <div className="text-xl font-bold text-blue-900 mt-1 flex items-center justify-between">
            {analysis.linhasNovas}
            <PlusCircle className="h-4 w-4 text-blue-500" />
          </div>
        </Card>

        <Card className="p-3 bg-slate-50 border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-600 block uppercase">
            Linhas Idênticas
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1 flex items-center justify-between">
            {analysis.linhasIdenticas}
            <Equal className="h-4 w-4 text-slate-400" />
          </div>
        </Card>

        <Card className="p-3 bg-amber-50/60 border-amber-200 shadow-xs">
          <span className="text-[11px] font-medium text-amber-700 block uppercase">
            Linhas Diferentes
          </span>
          <div className="text-xl font-bold text-amber-900 mt-1 flex items-center justify-between">
            {analysis.linhasDiferentes}
            <RefreshCw className="h-4 w-4 text-amber-500" />
          </div>
        </Card>

        <Card className="p-3 bg-emerald-50/50 border-emerald-200 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-700 block uppercase">
            CNPJs Vinculados
          </span>
          <div className="text-xl font-bold text-emerald-900 mt-1 flex items-center justify-between">
            {analysis.cnpjsVinculados}
            <Building2 className="h-4 w-4 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-3 bg-rose-50/50 border-rose-200 shadow-xs">
          <span className="text-[11px] font-medium text-rose-700 block uppercase">
            Não Localizados
          </span>
          <div className="text-xl font-bold text-rose-900 mt-1 flex items-center justify-between">
            {analysis.cnpjsNaoLocalizados}
            <HelpCircle className="h-4 w-4 text-rose-500" />
          </div>
        </Card>

        <Card className="p-3 bg-purple-50/50 border-purple-200 shadow-xs">
          <span className="text-[11px] font-medium text-purple-700 block uppercase">
            CNPJs Múltiplos
          </span>
          <div className="text-xl font-bold text-purple-900 mt-1 flex items-center justify-between">
            {analysis.cnpjsMultiplos}
            <Layers className="h-4 w-4 text-purple-500" />
          </div>
        </Card>

        <Card className="p-3 bg-red-50/60 border-red-200 shadow-xs">
          <span className="text-[11px] font-medium text-red-700 block uppercase">
            Diverg. Fórmula
          </span>
          <div className="text-xl font-bold text-red-900 mt-1 flex items-center justify-between">
            {analysis.linhasComDivergenciaFormula}
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Tabs com Detalhamento das Linhas e Análise de Bases/Filiais */}
      <Tabs defaultValue="linhas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100">
          <TabsTrigger value="linhas" className="data-[state=active]:bg-white">
            <FileCheck className="h-4 w-4 mr-2" />
            Conferência Linha a Linha ({analysis.rows.length})
          </TabsTrigger>
          <TabsTrigger value="bases" className="data-[state=active]:bg-white">
            <Building2 className="h-4 w-4 mr-2" />
            Análise Bases / Filiais ({analysis.baseAnalysis.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Linhas Detalhadas */}
        <TabsContent value="linhas" className="space-y-4 pt-2">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por CNPJ, Razão Social, Base..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setStatusFilter('all')}
              >
                Todos ({analysis.rows.length})
              </Button>
              <Button
                variant={statusFilter === 'novas' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setStatusFilter('novas')}
              >
                Novas ({analysis.linhasNovas})
              </Button>
              <Button
                variant={statusFilter === 'diferentes' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setStatusFilter('diferentes')}
              >
                Diferentes ({analysis.linhasDiferentes})
              </Button>
              <Button
                variant={statusFilter === 'nao_vinculados' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 text-rose-700"
                onClick={() => setStatusFilter('nao_vinculados')}
              >
                Não Vinculados ({analysis.cnpjsNaoLocalizados})
              </Button>
              {analysis.linhasComDivergenciaFormula > 0 && (
                <Button
                  variant={statusFilter === 'divergencia' ? 'destructive' : 'outline'}
                  size="sm"
                  className="text-xs h-8 text-red-700"
                  onClick={() => setStatusFilter('divergencia')}
                >
                  Diverg. Fórmula ({analysis.linhasComDivergenciaFormula})
                </Button>
              )}
            </div>
          </div>

          {/* Tabela de Linhas */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <ScrollArea className="h-[480px] w-full">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[60px] text-xs">Linha</TableHead>
                    <TableHead className="text-xs">CNPJ & Razão Social</TableHead>
                    <TableHead className="text-xs">Vínculo Cliente</TableHead>
                    <TableHead className="text-xs">Base</TableHead>
                    <TableHead className="text-xs text-right">Contratado</TableHead>
                    <TableHead className="text-xs text-right">Total Emitido</TableHead>
                    <TableHead className="text-xs text-right">Saldo</TableHead>
                    <TableHead className="text-xs text-right">Vl. Cobrança</TableHead>
                    <TableHead className="text-xs text-center">Status / Auditoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500 text-sm">
                        Nenhum registro encontrado para o filtro aplicado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const isContratadoZero = row.contratado === 0

                      return (
                        <TableRow key={row.rowIndex} className="hover:bg-slate-50/80 text-xs">
                          <TableCell className="font-mono text-slate-500 font-medium">
                            #{row.rowIndex}
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold text-slate-900">{row.razaoSocial}</div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {formatCNPJ(row.cnpjNormalized) || row.cnpjRaw || '—'}
                            </div>
                          </TableCell>

                          <TableCell>
                            {row.clienteId ? (
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0"
                                >
                                  Vinculado
                                </Badge>
                                {row.isMultiplo && (
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] py-0"
                                    title="Múltiplas correspondências de filiais encontradas"
                                  >
                                    Múltiplo
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] py-0"
                              >
                                Não Localizado
                              </Badge>
                            )}
                            {row.clienteNome && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                                {row.clienteNome}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-slate-700">
                            {row.base ? (
                              <span className="font-medium">{row.base}</span>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </TableCell>

                          {/* Contratado com regra Contratado = 0 */}
                          <TableCell className="text-right">
                            {isContratadoZero ? (
                              <span
                                className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]"
                                title="Limite contratado não identificado"
                              >
                                Limite não identificado (0)
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-800">
                                {row.contratado.toLocaleString('pt-BR')}
                              </span>
                            )}
                          </TableCell>

                          {/* Total Emitido com alerta de divergência de fórmula */}
                          <TableCell className="text-right">
                            <div className="font-semibold text-slate-900">
                              {row.totalEmitido.toLocaleString('pt-BR')}
                            </div>
                            {row.divergenciaFormula && (
                              <span
                                className="text-[10px] text-red-600 font-bold flex items-center justify-end gap-0.5 mt-0.5"
                                title={`Soma dos docs: ${row.somaDocsCalculada} != Total emitido: ${row.totalEmitido}`}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Div. Docs ({row.somaDocsCalculada})
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-right font-medium text-slate-700">
                            {row.saldo.toLocaleString('pt-BR')}
                          </TableCell>

                          <TableCell className="text-right font-semibold text-slate-900">
                            {formatCurrency(row.valorCobranca)}
                          </TableCell>

                          {/* Status de comparação com o banco */}
                          <TableCell className="text-center">
                            {row.statusComparacao === 'novo' && (
                              <Badge className="bg-blue-100 text-blue-800 border-none text-[10px]">
                                Novo
                              </Badge>
                            )}
                            {row.statusComparacao === 'identico' && (
                              <Badge className="bg-slate-100 text-slate-700 border-none text-[10px]">
                                Idêntico
                              </Badge>
                            )}
                            {row.statusComparacao === 'diferente' && (
                              <div className="flex flex-col items-center">
                                <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">
                                  Alterado
                                </Badge>
                                {row.diferencas && row.diferencas.length > 0 && (
                                  <span
                                    className="text-[9px] text-amber-700 underline cursor-help mt-0.5"
                                    title={row.diferencas.join('\n')}
                                  >
                                    {row.diferencas.length} alteração(ões)
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Tab 2: Análise de Contratado por Base ou Filial */}
        <TabsContent value="bases" className="space-y-4 pt-2">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Diagnóstico de Bases e Limites Contratados
              </CardTitle>
              <CardDescription className="text-xs">
                Identificação automática de padrões: bases com filial única vs múltiplas filiais,
                limites repetidos, limites zerados e potenciais contratos por base vs limites
                individuais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.baseAnalysis.map((b, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border text-xs space-y-2 ${
                      b.isInconsistencyAlert
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{b.baseName}</span>
                      <Badge
                        variant="outline"
                        className="bg-white text-slate-700 border-slate-300 text-[11px]"
                      >
                        {b.totalLinhas} {b.totalLinhas === 1 ? 'filial' : 'filiais'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 block">Tipo de Base:</span>
                        <span className="font-medium text-slate-800">
                          {b.isSingleBranch ? 'Filial Única' : 'Múltiplas Filiais'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Contratados na Base:</span>
                        <span className="font-medium text-slate-800">
                          {b.contratados.join(', ')}
                        </span>
                      </div>
                    </div>

                    {b.inconsistencyMessage && (
                      <div
                        className={`p-2 rounded text-[11px] flex items-start gap-1.5 ${
                          b.isInconsistencyAlert
                            ? 'bg-amber-100 text-amber-900 font-medium'
                            : 'bg-indigo-50/70 text-indigo-900'
                        }`}
                      >
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{b.inconsistencyMessage}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação e Gravação Segura */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Confirmar Importação de Utilização
            </DialogTitle>
            <DialogDescription>
              Competência: <strong>{analysis.competenciaConfirmada}</strong> | Linhas válidas:{' '}
              <strong>{analysis.linhasValidas}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {isReimportacao && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-700" />
                  Substituição Segura de Competência Vigente
                </div>
                <p>
                  Os registros anteriores da competência {analysis.competenciaConfirmada} serão
                  desativados (<code>vigente = false</code>) e arquivados em{' '}
                  <code>sl_historico_revisoes</code>.
                </p>
                <div className="space-y-1 pt-1">
                  <Label htmlFor="motivo-reimp" className="text-amber-950 font-semibold">
                    Motivo da Reimportação (Obrigatório para Auditoria):
                  </Label>
                  <Input
                    id="motivo-reimp"
                    placeholder="Ex: Atualização de volumetria de CTe e NFe autorizada pelo cliente..."
                    value={motivoReimportacao}
                    onChange={(e) => setMotivoReimportacao(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="obs-imp">Observações adicionais (opcional):</Label>
              <Textarea
                id="obs-imp"
                placeholder="Observações internas sobre esta importação..."
                rows={2}
                value={observacaoGeral}
                onChange={(e) => setObservacaoGeral(e.target.value)}
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
              <p>
                <strong>Garantia de Integridade:</strong> Nenhum cliente, CNPJ ou filial cadastrada
                no sistema será alterado ou criado automaticamente. Apenas registros de utilização e
                auditoria serão gravados.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={(isReimportacao && !motivoReimportacao.trim()) || isSubmitting}
              onClick={handleFinalSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gravando no Banco...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Gravar e Finalizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
