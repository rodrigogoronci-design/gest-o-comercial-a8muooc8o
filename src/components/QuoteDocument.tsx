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
  additionalPlates?: number
  additionalPlatesPrice?: number
  additionalPlatesTotal?: number
  additionalBranches?: number
  additionalBranchesPrice?: number
  additionalBranchesTotal?: number
  descontoMensalidade?: number
  tipoDesconto?: 'valor' | 'percentual'
  calculatedDiscount?: number
  isencaoPeriodo?: number
  moduleGracePeriods?: Record<string, number>
  totalValueStandard?: number
  prazosConcedidos?: string
  cobrarDfePorFilial?: boolean
  quantidadeFiliaisDfe?: number
  baseDfePrice?: number
  planBilling?: 'mensal' | 'anual'
  planAnnualPrice?: number
  dfeBilling?: 'mensal' | 'anual'
  dfeAnnualPrice?: number
  platesBilling?: 'mensal' | 'anual'
  platesAnnualPrice?: number
  branchesBilling?: 'mensal' | 'anual'
  branchesAnnualPrice?: number
  totalAnual?: number
  filiaisDfe?: { id?: string; cnpj?: string; nome?: string }[]
}

const FEATURE_CATEGORIES = [
  {
    title: 'Administração',
    items: ['Configurações do usuário', 'Configurações de acesso', 'Integração de E-mail'],
  },
  {
    title: 'Básico',
    items: ['Matriz e Filiais', 'Clientes', 'Fornecedores', 'Veículos', 'Motoristas'],
  },
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
    title: 'Comercial',
    items: ['Gestão de CRM', 'Tabelas de Frete', 'Cotações', 'Propostas Comerciais'],
  },
  {
    title: 'Faturamento',
    items: ['Geração de Faturas', 'Envio em Lote', 'Gestão de Boletos', 'Arquivo Remessa/Retorno'],
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
  additionalPlates,
  additionalPlatesPrice,
  additionalPlatesTotal,
  additionalBranches,
  additionalBranchesPrice,
  additionalBranchesTotal,
  descontoMensalidade = 0,
  tipoDesconto = 'valor',
  calculatedDiscount = 0,
  isencaoPeriodo = 0,
  moduleGracePeriods = {},
  totalValueStandard = 0,
  prazosConcedidos,
  cobrarDfePorFilial = false,
  quantidadeFiliaisDfe = 1,
  baseDfePrice = 0,
  planBilling = 'mensal',
  planAnnualPrice = 0,
  dfeBilling = 'mensal',
  dfeAnnualPrice = 0,
  platesBilling = 'mensal',
  platesAnnualPrice = 0,
  branchesBilling = 'mensal',
  branchesAnnualPrice = 0,
  totalAnual = 0,
  filiaisDfe = [],
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
                <th className="p-1.5 border-b border-slate-200 text-center">Ciclo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showBasePlan && !isUpsell && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">{planName}</span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      Administração, Básico, Carga, Comercial, Faturamento e Financeiro
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">
                    {planBilling === 'anual'
                      ? formatCurrency(planAnnualPrice)
                      : formatCurrency(planPrice)}
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    {planBilling === 'anual'
                      ? formatCurrency(planAnnualPrice)
                      : formatCurrency(planPrice)}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">
                    {planBilling === 'anual' ? 'Anual' : 'Mensal'}
                  </td>
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
                  <td className="p-1.5 text-center text-slate-600">Mensal</td>
                </tr>
              )}
              {selectedModulesData.map((m, idx) => {
                const hasGrace = moduleGracePeriods[m.id] > 0
                const graceMonths = moduleGracePeriods[m.id]
                const cicle = m.billingCycle || 'mensal'
                const p = cicle === 'anual' ? m.annualPrice : m.price

                return (
                  <tr key={`mod-${idx}`}>
                    <td className="p-1.5">
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      {hasGrace && (
                        <span className="text-[9px] font-bold text-emerald-600 ml-2">
                          (Isento por {graceMonths} meses)
                        </span>
                      )}
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
                    <td className="p-1.5 text-right">{formatCurrency(p)}</td>
                    <td className="p-1.5 text-right font-medium">
                      {hasGrace ? (
                        <span className="line-through text-slate-400 mr-1">
                          {formatCurrency(p)}
                        </span>
                      ) : null}
                      {hasGrace ? formatCurrency(0) : formatCurrency(p)}
                    </td>
                    <td className="p-1.5 text-center text-slate-600">
                      {hasGrace
                        ? `Isento por ${graceMonths} meses`
                        : cicle === 'anual'
                          ? 'Anual'
                          : 'Mensal'}
                    </td>
                  </tr>
                )
              })}

              {includeFranchise && dfeData && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">
                      {dfeData.name || 'Franquia de Emissões (DF-e)'}
                      {cobrarDfePorFilial ? ` (Por Filial: ${quantidadeFiliaisDfe}x)` : ''}
                    </span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      Pacote de emissões eletrônicas
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">
                    {cobrarDfePorFilial ? quantidadeFiliaisDfe : 1}
                  </td>
                  <td className="p-1.5 text-right">
                    {(dfeBilling === 'anual' ? dfeAnnualPrice : baseDfePrice) &&
                    (dfeBilling === 'anual' ? dfeAnnualPrice : baseDfePrice)! > 0
                      ? formatCurrency(dfeBilling === 'anual' ? dfeAnnualPrice! : baseDfePrice!)
                      : 'Incluso'}
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    {(dfeBilling === 'anual' ? dfeAnnualPrice : dfePrice) &&
                    (dfeBilling === 'anual' ? dfeAnnualPrice : dfePrice)! > 0
                      ? formatCurrency(dfeBilling === 'anual' ? dfeAnnualPrice! : dfePrice!)
                      : 'Incluso'}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">
                    {dfeBilling === 'anual' ? 'Anual' : 'Mensal'}
                  </td>
                </tr>
              )}

              {!!additionalPlates && additionalPlates > 0 && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">(*) Placa Adicional Frota</span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      Placas excedentes do módulo Frota
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">{additionalPlates}</td>
                  <td className="p-1.5 text-right">
                    {platesBilling === 'anual' ? '-' : formatCurrency(additionalPlatesPrice || 0)}
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    {formatCurrency(
                      platesBilling === 'anual' ? platesAnnualPrice : additionalPlatesTotal || 0,
                    )}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">
                    {platesBilling === 'anual' ? 'Anual' : 'Mensal'}
                  </td>
                </tr>
              )}

              {!!additionalBranches && additionalBranches > 0 && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">Filiais Adicionais</span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      CNPJs adicionais da mesma raiz
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">{additionalBranches}</td>
                  <td className="p-1.5 text-right">
                    {branchesBilling === 'anual'
                      ? '-'
                      : formatCurrency(additionalBranchesPrice || 199)}
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    {formatCurrency(
                      branchesBilling === 'anual'
                        ? branchesAnnualPrice
                        : additionalBranchesTotal || 0,
                    )}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">
                    {branchesBilling === 'anual' ? 'Anual' : 'Mensal'}
                  </td>
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
                  <td className="p-1.5 text-right">
                    {t.isFree ? 'Grátis' : formatCurrency(Number(t.price) || 0)}
                  </td>
                  <td className="p-1.5 text-right font-medium">
                    {t.isFree ? (
                      <span className="text-emerald-600">Cortesia</span>
                    ) : (
                      formatCurrency(Number(t.price) || 0)
                    )}
                  </td>
                  <td className="p-1.5 text-center text-slate-600">Parcela Única</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {prazosConcedidos && (
        <div className="mb-4">
          <h3 className="font-bold text-xs text-[#1e3a8a] mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-3 bg-orange-500 rounded-full" />
            Condições Especiais / Prazos Concedidos
          </h3>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs text-slate-700 text-justify">
            {prazosConcedidos}
          </div>
        </div>
      )}

      {cobrarDfePorFilial && filiaisDfe && filiaisDfe.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-xs text-[#1e3a8a] mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-3 bg-orange-500 rounded-full" />
            Filiais Consideradas na Franquia DF-e
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filiaisDfe.map((f, i) => (
              <div
                key={i}
                className="bg-slate-50 p-2 rounded border border-slate-200 shadow-sm text-[10px]"
              >
                <p
                  className="font-bold text-slate-800 truncate"
                  title={f.nome || 'Filial não identificada'}
                >
                  {f.nome || 'Filial não identificada'}
                </p>
                <p className="text-slate-600 mt-0.5">CNPJ: {f.cnpj || 'Não informado'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <span>Valor dos Adicionais (Upsell Mensal)</span>
                <span className="font-medium">{formatCurrency(totalValue)}</span>
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
                <span>Nova Mensalidade</span>
                <span>{formatCurrency((currentClientValue || 0) + totalValue)}</span>
              </div>

              {totalAnual! > 0 && (
                <>
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-slate-600">
                    <span>Valor dos Adicionais (Upsell Anual)</span>
                    <span className="font-medium">{formatCurrency(totalAnual!)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
                    <span>Novo Valor Anual (Adicionais)</span>
                    <span>{formatCurrency(totalAnual!)}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 text-[10px]">
              {showBasePlan && planBilling === 'mensal' && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Plano Base (Mensal)</span>
                  <span className="font-medium">{formatCurrency(planPrice)}</span>
                </div>
              )}
              {selectedModulesData
                .filter((m) => m.billingCycle !== 'anual')
                .map((m, idx) => (
                  <div
                    key={`rec-mod-${idx}`}
                    className="flex justify-between items-center text-slate-600"
                  >
                    <span>{m.name}</span>
                    <span className="font-medium">{formatCurrency(m.price)}</span>
                  </div>
                ))}
              {includeFranchise && dfeData && dfeBilling === 'mensal' && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>{dfeData.name || 'Franquia DF-e'}</span>
                  <span className="font-medium">{formatCurrency(dfePrice || 0)}</span>
                </div>
              )}
              {!!additionalPlates && additionalPlates > 0 && platesBilling === 'mensal' && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Placas Adicionais ({additionalPlates})</span>
                  <span className="font-medium">{formatCurrency(additionalPlatesTotal || 0)}</span>
                </div>
              )}
              {!!additionalBranches && additionalBranches > 0 && branchesBilling === 'mensal' && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Filiais Adicionais ({additionalBranches})</span>
                  <span className="font-medium">
                    {formatCurrency(additionalBranchesTotal || 0)}
                  </span>
                </div>
              )}
              {calculatedDiscount > 0 && (
                <>
                  <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center text-slate-600 font-medium">
                    <span>Valor Calculado Mensal Padrão</span>
                    <span>{formatCurrency(totalValueStandard || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-medium mt-1">
                    <span>
                      Desconto Aplicado{' '}
                      {tipoDesconto === 'percentual' ? `(${descontoMensalidade}%)` : ''}
                    </span>
                    <span>- {formatCurrency(calculatedDiscount)}</span>
                  </div>
                </>
              )}
              {totalValue !== Math.max(0, (totalValueStandard || 0) - calculatedDiscount) && (
                <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center text-orange-600 font-medium">
                  <span>Ajuste Comercial Mensal</span>
                  <span>
                    {formatCurrency(
                      totalValue - Math.max(0, (totalValueStandard || 0) - calculatedDiscount),
                    )}
                  </span>
                </div>
              )}
              <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
                <span>Total Mensal Final</span>
                <span>{formatCurrency(totalValue)}</span>
              </div>

              {totalAnual! > 0 && (
                <>
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-slate-600">
                    <span>Itens Anuais (Total)</span>
                    <span className="font-medium">{formatCurrency(totalAnual!)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
                    <span>Total Anual Final</span>
                    <span>{formatCurrency(totalAnual!)}</span>
                  </div>
                </>
              )}
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
                <span className="font-medium">
                  {t.isFree ? (
                    <span className="text-emerald-600">Grátis</span>
                  ) : (
                    formatCurrency(Number(t.price) || 0)
                  )}
                </span>
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
