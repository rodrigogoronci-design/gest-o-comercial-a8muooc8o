import { formatCurrency } from '@/lib/formatters'
import logoUrl from '@/assets/logomarca-service-ea011.png'

interface QuoteDocumentProps {
  empresa: string
  aosCuidadosDe: string
  date: string
  planName: string
  selectedModulesData?: any[]
  trainings?: any[]
  planPrice: number
  modulesPrice: number
  selectedDfe?: string
  dfeData?: any
  dfePrice?: number
  totalValue: number
  implMode: string
  implRate: number
  totalImplHours: number
  implValue: number
  isUpsell?: boolean
  includeFranchise?: boolean
  includeDiagnosticVisit?: boolean
  diagnosticVisitValue?: string
  diagnosticVisits?: { id: string; date: string; value: string }[]
  currentClientValue?: number
}

const FEATURE_CATEGORIES = [
  {
    title: 'Carga',
    items: [
      'Emissão CT-e',
      'Emissão MDF-e',
      'Emissão NFS-e',
      'Controle de Entrega',
      'Programação de Carga',
    ],
  },
  {
    title: 'Financeiro',
    items: [
      'Contas a Pagar/Receber',
      'Conciliação bancária',
      'Emissão boleto',
      'Fluxo de caixa',
      'DRE Gerencial',
    ],
  },
  {
    title: 'Fiscal',
    items: ['SPED Fiscal', 'Sintegra', 'Emissão NF-e', 'Nota Fiscal Eletrônica', 'Apuração ICMS'],
  },
  {
    title: 'Básico',
    items: ['Matriz e Filiais', 'Clientes', 'Fornecedores', 'Veículos', 'Motoristas'],
  },
  {
    title: 'Administração',
    items: ['Configurações do usuário', 'Configurações de acesso', 'Integração de E-mail'],
  },
  {
    title: 'Controle de Viagem',
    items: ['Registro de viagem', 'Adiantamento', 'Despesas da viagem', 'Acerto de contas'],
  },
]

export function QuoteDocument({
  empresa,
  aosCuidadosDe,
  date,
  planName,
  selectedModulesData = [],
  trainings = [],
  planPrice,
  modulesPrice,
  dfeData,
  dfePrice,
  totalValue,
  implMode,
  totalImplHours,
  implValue,
  isUpsell,
  includeFranchise,
  includeDiagnosticVisit,
  diagnosticVisitValue,
  diagnosticVisits,
  currentClientValue,
}: QuoteDocumentProps) {
  const showBasePlan =
    planName && planName !== 'Nenhum' && planName !== 'Nenhum (Somente Módulos / Upsell)'

  return (
    <div
      className="bg-white w-full max-w-[210mm] mx-auto p-4 md:p-6 print:m-0 print:p-4 text-slate-800 text-xs shadow-sm print:shadow-none font-sans"
      id="quote-proposal-print"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Service Logic" className="h-10 object-contain shrink-0" />
          <div className="text-[9px] text-slate-500 leading-tight space-y-0.5 border-l border-slate-200 pl-3">
            <p className="font-semibold text-slate-700">SERVICE LOGIC SOLUÇÕES EM TECNOLOGIA</p>
            <p>CNPJ: 10.929.600/0001-92</p>
            <p>Avenida Central, 1439 CEP: 29165-130, Serra-ES</p>
            <p>(27) 2141-0107 / comercial@servicelogic.com.br</p>
          </div>
        </div>
      </div>

      {/* Title & Client Info */}
      <div className="flex justify-between items-end border-b-2 border-orange-500 pb-1.5 mb-3">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wider text-[#1e3a8a]">
            {isUpsell ? 'Proposta Comercial - Upsell' : 'Proposta Comercial'}
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">
            {showBasePlan ? planName : 'Adição de Módulos e Serviços'}
          </p>
        </div>
        <div className="text-right text-[10px]">
          <p>
            <strong>Data:</strong> {date}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
        <div className="flex-1">
          <span className="block text-slate-500 mb-0.5">Empresa</span>
          <strong className="text-slate-900 text-xs">{empresa || 'Não informado'}</strong>
        </div>
        <div className="flex-1">
          <span className="block text-slate-500 mb-0.5">Aos Cuidados de</span>
          <strong className="text-slate-900 text-xs">{aosCuidadosDe || 'Não informado'}</strong>
        </div>
      </div>

      {/* Features */}
      {showBasePlan && !isUpsell && (
        <div className="mb-4">
          <h3 className="font-bold text-xs text-[#1e3a8a] mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-3 bg-orange-500 rounded-full" />
            Funcionalidades Inclusas no Plano Base
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {FEATURE_CATEGORIES.map((cat, i) => (
              <div key={i} className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 text-[10px] mb-1 pb-0.5 border-b border-slate-100">
                  {cat.title}
                </h4>
                <ul className="space-y-0.5">
                  {cat.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-1 text-[9px] text-slate-600 leading-tight"
                    >
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Details */}
      <div className="mb-4">
        <h3 className="font-bold text-xs text-[#1e3a8a] mb-2 flex items-center gap-1.5">
          <div className="w-1.5 h-3 bg-orange-500 rounded-full" />
          Investimento Detalhado
        </h3>
        <div className="bg-white rounded overflow-hidden border border-slate-200 shadow-sm">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-1.5 border-b border-slate-200">Descrição</th>
                <th className="p-1.5 border-b border-slate-200 text-center">Qtd</th>
                <th className="p-1.5 border-b border-slate-200 text-right">V. Unitário</th>
                <th className="p-1.5 border-b border-slate-200 text-right">V. Total</th>
                <th className="p-1.5 border-b border-slate-200 text-center">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showBasePlan && !isUpsell && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">{planName}</span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      Administração, Básico, Carga, Faturamento e Financeiro
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">{formatCurrency(planPrice)}</td>
                  <td className="p-1.5 text-right font-medium">{formatCurrency(planPrice)}</td>
                  <td className="p-1.5 text-center text-slate-600">Mensalidade</td>
                </tr>
              )}
              {isUpsell && (currentClientValue || 0) > 0 && (
                <tr className="bg-slate-50/50">
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">Mensalidade Atual</span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      Valor pago atualmente pelo cliente
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">{formatCurrency(currentClientValue || 0)}</td>
                  <td className="p-1.5 text-right font-medium">
                    {formatCurrency(currentClientValue || 0)}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">Mensalidade Atual</td>
                </tr>
              )}
              {selectedModulesData.map((m, idx) => (
                <tr key={`mod-${idx}`}>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    {m.id === 'mod-edi' && (
                      <span className="text-[9px] block text-slate-500 mt-1.5 italic border-t border-slate-100 pt-1">
                        <strong>* EDI:</strong> Inclusão de Layout padrão Proceda para integração
                        (arquivos NOTFIS para emissão de CT-e, envios de CONEMB, DOCCOB e OCOREN).
                      </span>
                    )}
                    {m.description && !m.name?.toLowerCase().includes('torre de controle') && (
                      <span className="text-[9px] block text-slate-500 mt-1.5 italic border-t border-slate-100 pt-1">
                        {m.description}
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">{formatCurrency(m.price)}</td>
                  <td className="p-1.5 text-right font-medium">{formatCurrency(m.price)}</td>
                  <td className="p-1.5 text-center text-slate-600">Mensalidade</td>
                </tr>
              ))}

              {includeFranchise && dfeData && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">
                      {dfeData.name || 'Franquia de Emissões (DF-e)'}
                    </span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      Pacote de emissões eletrônicas
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">
                    {dfePrice && dfePrice > 0 ? formatCurrency(dfePrice) : 'Incluso'}
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    {dfePrice && dfePrice > 0 ? formatCurrency(dfePrice) : 'Incluso'}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">Mensalidade</td>
                </tr>
              )}

              {implValue > 0 &&
                implValue -
                  trainings.reduce((acc, t) => acc + (Number(t.price) || 0), 0) -
                  (includeDiagnosticVisit && diagnosticVisits
                    ? diagnosticVisits.reduce((acc, v) => acc + (Number(v.value) || 0), 0)
                    : 0) >
                  0 && (
                  <tr>
                    <td className="p-1.5">
                      <span className="font-semibold text-slate-800">
                        Serviços de Implantação / Configuração (
                        {implMode === 'remoto' ? 'Remoto' : 'Presencial'})
                      </span>
                      <span className="text-[9px] block text-slate-500 mt-0.5">
                        {totalImplHours > 0
                          ? `Total estimado: ${totalImplHours} horas`
                          : 'Taxa de setup inicial'}
                      </span>
                    </td>
                    <td className="p-1.5 text-center font-medium">1</td>
                    <td className="p-1.5 text-right">
                      {formatCurrency(
                        implValue -
                          trainings.reduce((acc, t) => acc + (Number(t.price) || 0), 0) -
                          (includeDiagnosticVisit && diagnosticVisits
                            ? diagnosticVisits.reduce((acc, v) => acc + (Number(v.value) || 0), 0)
                            : 0),
                      )}
                    </td>
                    <td className="p-1.5 text-right font-medium">
                      {formatCurrency(
                        implValue -
                          trainings.reduce((acc, t) => acc + (Number(t.price) || 0), 0) -
                          (includeDiagnosticVisit && diagnosticVisits
                            ? diagnosticVisits.reduce((acc, v) => acc + (Number(v.value) || 0), 0)
                            : 0),
                      )}
                    </td>
                    <td className="p-1.5 text-center text-slate-600">Parcela Única</td>
                  </tr>
                )}

              {includeDiagnosticVisit &&
                diagnosticVisits?.map((visit, index) => (
                  <tr key={`diag-${index}`}>
                    <td className="p-1.5">
                      <span className="font-semibold text-slate-800">
                        Visita Presencial de Diagnóstico
                        {visit.date
                          ? ` (Data: ${new Date(visit.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})`
                          : ''}
                      </span>
                    </td>
                    <td className="p-1.5 text-center font-medium">1</td>
                    <td className="p-1.5 text-right">{formatCurrency(Number(visit.value) || 0)}</td>
                    <td className="p-1.5 text-right font-medium">
                      {formatCurrency(Number(visit.value) || 0)}
                    </td>
                    <td className="p-1.5 text-center text-slate-600">Parcela Única</td>
                  </tr>
                ))}

              {trainings.map((t, idx) => (
                <tr key={`tr-${idx}`}>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">Treinamento: {t.name}</span>
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">{formatCurrency(Number(t.price) || 0)}</td>
                  <td className="p-1.5 text-right font-medium">
                    {formatCurrency(Number(t.price) || 0)}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">Parcela Única</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded border border-slate-200">
          <h4 className="font-bold text-slate-500 text-[9px] uppercase tracking-wider mb-2">
            Total Recorrente
          </h4>
          {isUpsell ? (
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between items-center text-slate-600">
                <span>Mensalidade Atual</span>
                <span className="font-medium">{formatCurrency(currentClientValue || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Valor dos Adicionais (Upsell)</span>
                <span className="font-medium">{formatCurrency(totalValue)}</span>
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
                <span>Nova Mensalidade Total</span>
                <span>{formatCurrency((currentClientValue || 0) + totalValue)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-[10px]">
              {showBasePlan && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Plano Base</span>
                  <span className="font-medium">{formatCurrency(planPrice)}</span>
                </div>
              )}
              {selectedModulesData.map((m, idx) => (
                <div
                  key={`rec-mod-${idx}`}
                  className="flex justify-between items-center text-slate-600"
                >
                  <span>{m.name}</span>
                  <span className="font-medium">{formatCurrency(m.price)}</span>
                </div>
              ))}
              {includeFranchise && dfeData && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>{dfeData.name || 'Franquia DF-e'}</span>
                  <span className="font-medium">{formatCurrency(dfePrice || 0)}</span>
                </div>
              )}
              <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
                <span>Total Mensal</span>
                <span>{formatCurrency(totalValue)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-200">
          <h4 className="font-bold text-slate-500 text-[9px] uppercase tracking-wider mb-2">
            Total Parcela Única
          </h4>
          <div className="space-y-1.5 text-[10px]">
            {implValue > 0 &&
              implValue -
                trainings.reduce((acc, t) => acc + (Number(t.price) || 0), 0) -
                (includeDiagnosticVisit && diagnosticVisits
                  ? diagnosticVisits.reduce((acc, v) => acc + (Number(v.value) || 0), 0)
                  : 0) >
                0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    Serviços de Implantação ({implMode === 'remoto' ? 'Remoto' : 'Presencial'})
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      implValue -
                        trainings.reduce((acc, t) => acc + (Number(t.price) || 0), 0) -
                        (includeDiagnosticVisit && diagnosticVisits
                          ? diagnosticVisits.reduce((acc, v) => acc + (Number(v.value) || 0), 0)
                          : 0),
                    )}
                  </span>
                </div>
              )}
            {includeDiagnosticVisit &&
              diagnosticVisits?.map((visit, index) => (
                <div
                  key={`diag-tot-${index}`}
                  className="flex justify-between items-center text-slate-600"
                >
                  <span>
                    Visita Presencial de Diagnóstico
                    {visit.date
                      ? ` (Data: ${new Date(visit.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})`
                      : ''}
                  </span>
                  <span className="font-medium">{formatCurrency(Number(visit.value) || 0)}</span>
                </div>
              ))}
            {trainings.map((t, idx) => (
              <div
                key={`rec-tr-${idx}`}
                className="flex justify-between items-center text-slate-600"
              >
                <span>Treinamento: {t.name}</span>
                <span className="font-medium">{formatCurrency(Number(t.price) || 0)}</span>
              </div>
            ))}
            <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
              <span>Total à Vista</span>
              <span>{formatCurrency(implValue)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400">
        <p>Validade desta proposta: 15 dias corridos.</p>
        <p>Para dúvidas ou esclarecimentos, entre em contato conosco.</p>
      </div>
    </div>
  )
}
