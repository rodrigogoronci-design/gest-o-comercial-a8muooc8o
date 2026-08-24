import React, { useState, useEffect } from 'react'
import {
  History,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Building2,
  PlusCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchImportacoesList, fetchHistoricoRevisoes } from '@/services/service-logic-utilizacao'
import { SLImportacao, SLHistoricoRevisao } from '@/types/service-logic-utilizacao'
import { formatDate } from '@/lib/formatters'

export const UtilizationHistory: React.FC = () => {
  const [importacoes, setImportacoes] = useState<SLImportacao[]>([])
  const [historicoRevisoes, setHistoricoRevisoes] = useState<SLHistoricoRevisao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImportacao, setSelectedImportacao] = useState<SLImportacao | null>(null)
  const [selectedRevisao, setSelectedRevisao] = useState<SLHistoricoRevisao | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [impList, revList] = await Promise.all([
        fetchImportacoesList().catch(() => []),
        fetchHistoricoRevisoes().catch(() => []),
      ])
      setImportacoes(impList)
      setHistoricoRevisoes(revList)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredImportacoes = importacoes.filter((imp) => {
    return (
      imp.arquivo_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      imp.competencia.includes(searchTerm) ||
      imp.hash_arquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (imp.observacao && imp.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
              <History className="h-5 w-5 text-indigo-600" />
              Histórico de Importações e Auditoria de Revisões
            </CardTitle>
            <CardDescription>
              Registro imutável de todas as planilhas importadas, checksums SHA-256 e logs de
              reimportações de competência.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            Atualizar Lista
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="importacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm bg-slate-100">
            <TabsTrigger value="importacoes" className="text-xs data-[state=active]:bg-white">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Importações Realizadas ({importacoes.length})
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="text-xs data-[state=active]:bg-white">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Auditoria de Revisões ({historicoRevisoes.length})
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Importações Realizadas */}
          <TabsContent value="importacoes" className="space-y-4 pt-3">
            <div className="flex items-center gap-2 max-w-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, competência, hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Data / Hora</TableHead>
                    <TableHead className="text-xs">Competência</TableHead>
                    <TableHead className="text-xs">Arquivo & Checksum</TableHead>
                    <TableHead className="text-xs text-center">Linhas Válidas</TableHead>
                    <TableHead className="text-xs text-center">Vínculos CNPJ</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                    <TableHead className="text-xs text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-xs">
                        Carregando histórico...
                      </TableCell>
                    </TableRow>
                  ) : filteredImportacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                        Nenhuma importação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredImportacoes.map((imp) => (
                      <TableRow key={imp.id} className="hover:bg-slate-50/70 text-xs">
                        <TableCell className="font-medium text-slate-700">
                          {new Date(imp.created_at).toLocaleString('pt-BR')}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-bold bg-slate-100 text-slate-800"
                          >
                            {imp.competencia}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-slate-900 truncate max-w-[220px]">
                            {imp.arquivo_nome}
                          </div>
                          <div
                            className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]"
                            title={imp.hash_arquivo}
                          >
                            SHA: {imp.hash_arquivo.slice(0, 16)}...
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="font-bold text-slate-900">{imp.linhas_validas}</span>
                          <span className="text-[10px] text-slate-400 block">
                            (+{imp.linhas_novas} novas / {imp.linhas_diferentes} alt)
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                            >
                              {imp.cnpjs_vinculados}
                            </Badge>
                            {imp.cnpjs_nao_localizados > 0 && (
                              <Badge
                                variant="outline"
                                className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                              >
                                {imp.cnpjs_nao_localizados} não loc.
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {imp.status === 'concluida' && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px]">
                              Vigente / Ativa
                            </Badge>
                          )}
                          {imp.status === 'substituida' && (
                            <Badge className="bg-slate-200 text-slate-700 border-none text-[10px]">
                              Substituída
                            </Badge>
                          )}
                          {imp.status === 'cancelada' && (
                            <Badge className="bg-rose-100 text-rose-800 border-none text-[10px]">
                              Cancelada
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                            onClick={() => setSelectedImportacao(imp)}
                          >
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Aba 2: Auditoria de Revisões */}
          <TabsContent value="auditoria" className="space-y-4 pt-3">
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Data Auditoria</TableHead>
                    <TableHead className="text-xs">CNPJ Auditado</TableHead>
                    <TableHead className="text-xs">Motivo da Revisão</TableHead>
                    <TableHead className="text-xs">Alterações Detectadas</TableHead>
                    <TableHead className="text-xs text-right">Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-500 text-xs">
                        Carregando logs de auditoria...
                      </TableCell>
                    </TableRow>
                  ) : historicoRevisoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                        Nenhum registro de revisão/substituição de competência encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historicoRevisoes.map((rev) => (
                      <TableRow key={rev.id} className="hover:bg-slate-50/70 text-xs">
                        <TableCell className="font-medium text-slate-700">
                          {new Date(rev.created_at).toLocaleString('pt-BR')}
                        </TableCell>

                        <TableCell className="font-mono text-slate-900 font-semibold">
                          {rev.dados_novos?.cnpj || rev.dados_anteriores?.cnpj || '—'}
                          <span className="block font-sans text-[10px] text-slate-500 font-normal truncate max-w-[160px]">
                            {rev.dados_novos?.razao_social || rev.dados_anteriores?.razao_social}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-[240px]">
                          <span
                            className="text-slate-800 font-medium block truncate"
                            title={rev.motivo}
                          >
                            {rev.motivo}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="text-[11px] text-slate-600">
                            Emitido: {rev.dados_anteriores?.total_emitido ?? 0} →{' '}
                            <strong>{rev.dados_novos?.total_emitido ?? 0}</strong>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                            onClick={() => setSelectedRevisao(rev)}
                          >
                            Comparar JSON
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modal Detalhes da Importação */}
      <Dialog
        open={!!selectedImportacao}
        onOpenChange={(open) => !open && setSelectedImportacao(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Detalhes da Importação
            </DialogTitle>
            <DialogDescription>Competência: {selectedImportacao?.competencia}</DialogDescription>
          </DialogHeader>
          {selectedImportacao && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Arquivo</span>
                  <span className="font-semibold text-slate-800 break-all">
                    {selectedImportacao.arquivo_nome}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">
                    Data Importação
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedImportacao.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block uppercase text-[10px] mb-0.5">
                  Checksum SHA-256
                </span>
                <span className="font-mono text-[11px] p-2 bg-slate-100 rounded border block break-all text-slate-700">
                  {selectedImportacao.hash_arquivo}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-slate-50 rounded border">
                  <span className="text-[10px] text-slate-400 block">Total Linhas</span>
                  <span className="text-base font-bold text-slate-800">
                    {selectedImportacao.total_linhas}
                  </span>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                  <span className="text-[10px] text-blue-600 block">Linhas Novas</span>
                  <span className="text-base font-bold text-blue-900">
                    {selectedImportacao.linhas_novas}
                  </span>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-100">
                  <span className="text-[10px] text-amber-600 block">Alteradas</span>
                  <span className="text-base font-bold text-amber-900">
                    {selectedImportacao.linhas_diferentes}
                  </span>
                </div>
              </div>

              {selectedImportacao.observacao && (
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-0.5">Observação:</span>
                  <p className="text-slate-600 italic">{selectedImportacao.observacao}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Comparar JSON da Revisão */}
      <Dialog open={!!selectedRevisao} onOpenChange={(open) => !open && setSelectedRevisao(null)}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Auditoria de Revisão de Utilização
            </DialogTitle>
            <DialogDescription>
              Motivo:{' '}
              <span className="font-semibold text-slate-800">{selectedRevisao?.motivo}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedRevisao && (
            <div className="grid grid-cols-2 gap-4 py-2 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase text-[10px] block">
                  Dados Anteriores:
                </span>
                <pre className="p-3 bg-slate-100 rounded border border-slate-200 font-mono text-[11px] overflow-auto max-h-[300px]">
                  {JSON.stringify(selectedRevisao.dados_anteriores, null, 2)}
                </pre>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-emerald-800 uppercase text-[10px] block">
                  Dados Novos:
                </span>
                <pre className="p-3 bg-emerald-50 rounded border border-emerald-200 font-mono text-[11px] overflow-auto max-h-[300px]">
                  {JSON.stringify(selectedRevisao.dados_novos, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
