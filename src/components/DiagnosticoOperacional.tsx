import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save } from 'lucide-react'
import { updateCliente } from '@/services/clientes'
import { toast } from 'sonner'

const AREAS_MELHORIA = [
  'Financeiro',
  'Fiscal',
  'BI / Relatórios',
  'Frota',
  'Controle de Viagens',
  'DF-e',
  'Automação operacional',
  'Faturamento',
]

export function DiagnosticoOperacional({
  clientId,
  initialData,
  onSaved,
}: {
  clientId: string
  initialData: any
  onSaved: (tags: string[]) => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState<any>(initialData || {})

  const handleChange = (field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleAreaMelhoriaChange = (area: string, checked: boolean) => {
    const current = data.areasMelhoria || []
    if (checked) {
      handleChange('areasMelhoria', [...current, area])
    } else {
      handleChange(
        'areasMelhoria',
        current.filter((a: string) => a !== area),
      )
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const tags: string[] = []
      if (data.utilizaPlanilhas) tags.push('Potencial Automação')
      if (data.dificuldadeOperacional === 'Financeiro') tags.push('Potencial Financeiro')
      if (Number(data.qtdVeiculosProprios) > 10) tags.push('Potencial Frota')
      if (data.areasMelhoria?.includes('BI / Relatórios')) tags.push('Potencial BI')
      if (data.faturamentoAtualmente === 'Manual') tags.push('Potencial Faturamento')

      await updateCliente(clientId, { diagnostico: data, tags })
      toast.success('Diagnóstico salvo com sucesso!')
      onSaved(tags)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar diagnóstico.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Diagnóstico Operacional</h3>
          <p className="text-sm text-slate-500">
            Mapeie dores, oportunidades e maturidade do cliente.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Diagnóstico
        </Button>
      </div>

      {/* 1. INFORMAÇÕES GERAIS */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">1. Informações Gerais</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Responsável pelo preenchimento</Label>
            <Input
              value={data.responsavelPreenchimento || ''}
              onChange={(e) => handleChange('responsavelPreenchimento', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data do contato</Label>
            <Input
              type="date"
              value={data.dataContato || ''}
              onChange={(e) => handleChange('dataContato', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Responsável da empresa</Label>
            <Input
              value={data.responsavelEmpresa || ''}
              onChange={(e) => handleChange('responsavelEmpresa', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input
              value={data.cargo || ''}
              onChange={(e) => handleChange('cargo', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 2. ESTRUTURA DA EMPRESA */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">2. Estrutura da Empresa</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Qtd. Filiais</Label>
            <Input
              type="number"
              value={data.qtdFiliais || ''}
              onChange={(e) => handleChange('qtdFiliais', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Qtd. Usuários</Label>
            <Input
              type="number"
              value={data.qtdUsuarios || ''}
              onChange={(e) => handleChange('qtdUsuarios', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Qtd. Emissões/mês</Label>
            <Input
              type="number"
              value={data.qtdEmissoes || ''}
              onChange={(e) => handleChange('qtdEmissoes', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Regime Tributário</Label>
            <Select
              value={data.regimeTributario}
              onValueChange={(val) => handleChange('regimeTributario', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fase da Empresa</Label>
            <Select
              value={data.faseEmpresa}
              onValueChange={(val) => handleChange('faseEmpresa', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inicial">Inicial</SelectItem>
                <SelectItem value="Estruturando">Estruturando</SelectItem>
                <SelectItem value="Crescimento">Crescimento</SelectItem>
                <SelectItem value="Operação madura">Operação madura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sensibilidade a Preço</Label>
            <Select
              value={data.sensibilidadePreco}
              onValueChange={(val) => handleChange('sensibilidadePreco', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Estados de atuação</Label>
            <Input
              value={data.estadosAtuacao || ''}
              onChange={(e) => handleChange('estadosAtuacao', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 3. OPERAÇÃO LOGÍSTICA */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">3. Operação Logística</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.frotaPropria}
              onCheckedChange={(val) => handleChange('frotaPropria', val)}
            />
            <Label>Frota Própria?</Label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Qtd. Veículos Próprios</Label>
            <Input
              type="number"
              disabled={!data.frotaPropria}
              value={data.qtdVeiculosProprios || ''}
              onChange={(e) => handleChange('qtdVeiculosProprios', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.possuiAgregados}
              onCheckedChange={(val) => handleChange('possuiAgregados', val)}
            />
            <Label>Possui Agregados?</Label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Qtd. Agregados</Label>
            <Input
              type="number"
              disabled={!data.possuiAgregados}
              value={data.qtdAgregados || ''}
              onChange={(e) => handleChange('qtdAgregados', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Operação</Label>
            <Select
              value={data.tipoOperacao}
              onValueChange={(val) => handleChange('tipoOperacao', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lotação">Lotação</SelectItem>
                <SelectItem value="Fracionado">Fracionado</SelectItem>
                <SelectItem value="Redespacho">Redespacho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border h-[68px]">
            <Switch
              checked={data.possuiArmazem}
              onCheckedChange={(val) => handleChange('possuiArmazem', val)}
            />
            <Label>Possui Armazém?</Label>
          </div>
        </div>
      </section>

      {/* 4. CENÁRIO ATUAL */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">4. Cenário Atual</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.utilizaOutroSistema}
              onCheckedChange={(val) => handleChange('utilizaOutroSistema', val)}
            />
            <Label>Utiliza outro sistema?</Label>
          </div>
          <div className="space-y-2">
            <Label>Qual sistema?</Label>
            <Input
              disabled={!data.utilizaOutroSistema}
              value={data.qualSistema || ''}
              onChange={(e) => handleChange('qualSistema', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.utilizaPlanilhas}
              onCheckedChange={(val) => handleChange('utilizaPlanilhas', val)}
            />
            <Label>Utiliza planilhas?</Label>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.processosManuais}
              onCheckedChange={(val) => handleChange('processosManuais', val)}
            />
            <Label>Possui processos manuais?</Label>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.integracaoBancaria}
              onCheckedChange={(val) => handleChange('integracaoBancaria', val)}
            />
            <Label>Possui integração bancária?</Label>
          </div>
          <div className="space-y-2">
            <Label>Como é o faturamento?</Label>
            <Select
              value={data.faturamentoAtualmente}
              onValueChange={(val) => handleChange('faturamentoAtualmente', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Automático">Automático</SelectItem>
                <SelectItem value="Parcial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 5. CONTROLE OPERACIONAL */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">5. Controle Operacional</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Controle de viagens</Label>
            <Select
              value={data.controleViagens}
              onValueChange={(val) => handleChange('controleViagens', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planilha">Planilha</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Não possui">Não possui</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Controle de frota</Label>
            <Select
              value={data.controleManutencao}
              onValueChange={(val) => handleChange('controleManutencao', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planilha">Planilha</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Não controla">Não controla</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Controle financeiro</Label>
            <Select
              value={data.controleFinanceiro}
              onValueChange={(val) => handleChange('controleFinanceiro', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planilha">Planilha</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Contador">Contador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 6. DORES E GARGALOS */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">6. Dores e Gargalos</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Principal dificuldade</Label>
            <Select
              value={data.dificuldadeOperacional}
              onValueChange={(val) => handleChange('dificuldadeOperacional', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emissão de documentos">Emissão de documentos</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Controle operacional">Controle operacional</SelectItem>
                <SelectItem value="Fiscal">Fiscal</SelectItem>
                <SelectItem value="Relatórios">Relatórios</SelectItem>
                <SelectItem value="Falta de automação">Falta de automação</SelectItem>
                <SelectItem value="Retrabalho">Retrabalho</SelectItem>
                <SelectItem value="Controle de frota">Controle de frota</SelectItem>
                <SelectItem value="Controle de viagens">Controle de viagens</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Setor com maior dificuldade</Label>
            <Select
              value={data.setorMaiorDificuldade}
              onValueChange={(val) => handleChange('setorMaiorDificuldade', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Fiscal">Fiscal</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Gestão">Gestão</SelectItem>
                <SelectItem value="Frota">Frota</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Processo que gera muito retrabalho</Label>
            <Textarea
              value={data.processoRetrabalho || ''}
              onChange={(e) => handleChange('processoRetrabalho', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Área sem controle hoje</Label>
            <Textarea
              value={data.areaSemControle || ''}
              onChange={(e) => handleChange('areaSemControle', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 7. INTERESSE EM MELHORIAS */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">
          7. Interesse em Melhorias
        </h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border w-fit">
            <Switch
              checked={data.interesseAutomatizar}
              onCheckedChange={(val) => handleChange('interesseAutomatizar', val)}
            />
            <Label>Possui interesse em automatizar processos?</Label>
          </div>
          <div className="space-y-2">
            <Label>Áreas com interesse em melhoria</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded border">
              {AREAS_MELHORIA.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`area-${area}`}
                    checked={(data.areasMelhoria || []).includes(area)}
                    onCheckedChange={(checked) =>
                      handleAreaMelhoriaChange(area, checked as boolean)
                    }
                  />
                  <Label htmlFor={`area-${area}`} className="text-sm font-normal cursor-pointer">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. OPORTUNIDADE COMERCIAL */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">
          8. Oportunidade Comercial
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Potencial de Upsell</Label>
            <Select
              value={data.potencialUpsell}
              onValueChange={(val) => handleChange('potencialUpsell', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixo">Baixo</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Módulo com maior potencial</Label>
            <Select
              value={data.moduloMaiorPotencial}
              onValueChange={(val) => handleChange('moduloMaiorPotencial', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fiscal">Fiscal</SelectItem>
                <SelectItem value="DF-e">DF-e</SelectItem>
                <SelectItem value="BI">BI</SelectItem>
                <SelectItem value="Frota">Frota</SelectItem>
                <SelectItem value="Controle de Viagem">Controle de Viagem</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Calendário">Calendário</SelectItem>
                <SelectItem value="Painel de Informações">Painel de Informações</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Momento da oportunidade</Label>
            <Select
              value={data.momentoOportunidade}
              onValueChange={(val) => handleChange('momentoOportunidade', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Imediato">Imediato</SelectItem>
                <SelectItem value="Curto prazo">Curto prazo</SelectItem>
                <SelectItem value="Médio prazo">Médio prazo</SelectItem>
                <SelectItem value="Futuro">Futuro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Observações comerciais</Label>
            <Textarea
              value={data.observacoesComerciais || ''}
              onChange={(e) => handleChange('observacoesComerciais', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 9. CLASSIFICAÇÃO DO CLIENTE */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">
          9. Classificação do Cliente
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Perfil do cliente</Label>
            <Select
              value={data.perfilCliente}
              onValueChange={(val) => handleChange('perfilCliente', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Conservador">Conservador</SelectItem>
                <SelectItem value="Econômico">Econômico</SelectItem>
                <SelectItem value="Crescimento">Crescimento</SelectItem>
                <SelectItem value="Estruturado">Estruturado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Maturidade operacional</Label>
            <Select
              value={data.maturidadeOperacional}
              onValueChange={(val) => handleChange('maturidadeOperacional', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inicial">Inicial</SelectItem>
                <SelectItem value="Estruturando">Estruturando</SelectItem>
                <SelectItem value="Crescimento">Crescimento</SelectItem>
                <SelectItem value="Maduro">Maduro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 10. FOLLOW-UP */}
      <section>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">10. Follow-up</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Próximo contato</Label>
            <Input
              type="date"
              value={data.proximoContato || ''}
              onChange={(e) => handleChange('proximoContato', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Responsável pelo acompanhamento</Label>
            <Input
              value={data.responsavelAcompanhamento || ''}
              onChange={(e) => handleChange('responsavelAcompanhamento', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.retornoComercial}
              onCheckedChange={(val) => handleChange('retornoComercial', val)}
            />
            <Label>Necessário retorno comercial?</Label>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded border">
            <Switch
              checked={data.criarOportunidade}
              onCheckedChange={(val) => handleChange('criarOportunidade', val)}
            />
            <Label>Criar oportunidade futura?</Label>
          </div>
        </div>
      </section>
    </div>
  )
}
