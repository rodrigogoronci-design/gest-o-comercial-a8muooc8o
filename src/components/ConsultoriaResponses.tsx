import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONSULTORIA_AREAS, CONSULTORIA_DOC_CATEGORIES } from '@/lib/consultoria-config'

interface Props {
  data: Record<string, any>
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-xs text-slate-500 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export function ConsultoriaResponses({ data }: Props) {
  if (!data || Object.keys(data).length === 0) return null

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Respostas do Formulário de Consultoria
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</p>
            <Row label="Razão Social" value={data.empresa_razao_social} />
            <Row label="Nome Fantasia" value={data.empresa_nome_fantasia} />
            <Row label="Insc. Estadual" value={data.empresa_inscricao_estadual} />
            <Row label="Insc. Municipal" value={data.empresa_inscricao_municipal} />
            <Row label="Endereço" value={data.empresa_endereco} />
          </div>
          <div className="p-3 rounded-lg bg-slate-50 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Responsável Legal</p>
            <Row label="Nome" value={data.legal_nome} />
            <Row label="Cargo" value={data.legal_cargo} />
            <Row label="CPF" value={data.legal_cpf} />
            <Row label="E-mail" value={data.legal_email} />
            <Row label="Telefone" value={data.legal_telefone} />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Ponto Focal</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Row label="Nome" value={data.focal_nome} />
            <Row label="Cargo" value={data.focal_cargo} />
            <Row label="Departamento" value={data.focal_departamento} />
            <Row label="Telefone" value={data.focal_telefone} />
            <Row label="E-mail" value={data.focal_email} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Responsáveis por Área</p>
          {CONSULTORIA_AREAS.map((area) => {
            const nome = data[`area_${area.key}_nome`]
            if (!nome) return null
            return (
              <div key={area.key} className="p-2 rounded border border-slate-200">
                <p className="text-xs font-medium text-slate-600">{area.label}</p>
                <div className="grid sm:grid-cols-4 gap-1 mt-1">
                  <Row label="Nome" value={nome} />
                  <Row label="Cargo" value={data[`area_${area.key}_cargo`]} />
                  <Row label="E-mail" value={data[`area_${area.key}_email`]} />
                  <Row label="Telefone" value={data[`area_${area.key}_telefone`]} />
                </div>
              </div>
            )
          })}
        </div>

        {(data.documentacao || []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Documentação Disponível ({(data.documentacao || []).length} itens)
            </p>
            <div className="flex flex-wrap gap-1">
              {(data.documentacao || []).map((doc: string) => (
                <Badge
                  key={doc}
                  variant="secondary"
                  className="text-[10px] bg-amber-50 text-amber-700"
                >
                  {doc}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-slate-50 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Operacional</p>
          <Row label="Volume médio" value={data.op_volume_medio} />
          <Row label="Tipo de carga" value={data.op_tipo_carga} />
          <Row label="Tipo de veículo" value={data.op_tipo_veiculo} />
          <Row label="Modalidade" value={data.op_modalidade} />
          <Row label="Origens e destinos" value={data.op_origens_destinos} />
          <Row label="Fluxo CT-e/MDF-e" value={data.op_fluxo_cte_mdfe} />
        </div>

        {data.observacoes && (
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Observações</p>
            <p className="text-sm whitespace-pre-wrap">{data.observacoes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
