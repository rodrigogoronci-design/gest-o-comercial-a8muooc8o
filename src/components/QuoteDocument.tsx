import { formatCurrency } from '@/lib/formatters'

export interface QuoteDocumentProps {
  empresa?: string
  cnpj?: string
  aosCuidadosDe?: string
  date?: string
  planName?: string
  planPrice?: number
  planAnnualPrice?: number
  planBilling?: string
  showBasePlan?: boolean
  isUpsell?: boolean
  isGratuito?: boolean
  currentClientValue?: number
  items?: any[]
  discountValue?: number
  discountType?: string
  logoUrl?: string
  selectedModulesData?: any[]
  trainings?: any[]
}

const SUB_FEATURES: Record<string, string[]> = {
  Administração: ['Configurações do usuário', 'Configurações de acesso', 'Integração de E-mail'],
  Básico: ['Matriz e Filiais', 'Clientes', 'Fornecedores', 'Veículos', 'Motoristas'],
  Carga: [
    'Emissão CT-e',
    'Emissão MDF-e',
    'Emissão NFS-e',
    'Controle de Entrega',
    'Programação de Carga',
  ],
  Comercial: ['Gestão de CRM', 'Tabelas de Frete', 'Cotações', 'Propostas Comerciais'],
  Faturamento: [
    'Geração de faturas',
    'Envio em Lote',
    'Gestão de Boletos',
    'Arquivo Remessa/Retorno',
  ],
  Financeiro: [
    'Contas a Pagar/Receber',
    'Conciliação bancária',
    'Emissão boleto',
    'Fluxo de caixa',
    'DRE Gerencial',
  ],
}

const TMS30_ALLOWED_MODULE_IDS = ['mod-admin', 'mod-basico', 'mod-carga', 'mod-comercial']

export function QuoteDocument(props: QuoteDocumentProps) {
  const {
    empresa = '',
    cnpj = '',
    aosCuidadosDe = '',
    date = '',
    planName = '',
    planPrice = 0,
    planAnnualPrice = 0,
    planBilling = 'mensal',
    showBasePlan = true,
    isUpsell = false,
    isGratuito = false,
    currentClientValue = 0,
    items = [],
    discountValue = 0,
    discountType = 'valor',
    logoUrl = '/skip.png',
    selectedModulesData = [],
    trainings = [],
  } = props

  const isTms30 =
    planName?.toLowerCase().includes('tms-30') || planName?.toLowerCase().includes('tms 30')
  const includedBaseModules = isTms30
    ? ['Administração', 'Básico', 'Carga', 'Comercial']
    : ['Administração', 'Básico', 'Carga', 'Comercial', 'Faturamento', 'Financeiro']

  const categoriesToRender = includedBaseModules.map((name) => ({
    title: name,
    items: SUB_FEATURES[name] || [],
  }))

  const safeItems = isTms30
    ? items.filter((i) => {
        if (
          i.type === 'plan' ||
          i.id === 'impl-details' ||
          i.type === 'training' ||
          i.type === 'one-time'
        )
          return true
        if (i.id?.startsWith('mod-') && !TMS30_ALLOWED_MODULE_IDS.includes(i.id)) return false
        return true
      })
    : items

  const recurrentItems = safeItems.filter(
    (i) =>
      i.id !== 'impl-details' &&
      i.type !== 'plan' &&
      i.type !== 'training' &&
      i.type !== 'one-time' &&
      !i.isFree,
  )
  const oneTimeItems = safeItems.filter(
    (i) => i.id === 'impl-details' || i.type === 'training' || i.type === 'one-time',
  )
  const implItem = oneTimeItems.find((i) => i.id === 'impl-details')
  const implMode = implItem?.modo || 'Remoto'

  const isAnnual = planBilling === 'anual'
  const cycleLabel = isAnnual ? 'Anual' : 'Mensal'
  const effectivePlanPrice = isAnnual ? planAnnualPrice || 0 : planPrice

  const planBaseContribution = showBasePlan && !isUpsell ? effectivePlanPrice : 0
  const totalRecorrenteBase =
    recurrentItems.reduce((acc, curr) => acc + (curr.price || 0), 0) + planBaseContribution
  const discountAmount =
    discountType === 'valor' ? discountValue : (totalRecorrenteBase * discountValue) / 100
  const totalRecorrenteFinal = Math.max(0, totalRecorrenteBase - discountAmount)
  const totalOneTime = oneTimeItems.reduce(
    (acc, curr) => acc + (curr.isFree ? 0 : curr.price || 0),
    0,
  )

  return (
    <div
      id="quote-proposal-print"
      className="bg-white text-slate-900 p-8 max-w-4xl mx-auto text-sm print:p-0 print:max-w-none font-sans"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 leading-tight">
              SERVICE LOGIC SOLUÇÕES EM TECNOLOGIA
            </span>
            <span className="text-[9px] text-slate-500 leading-tight">
              CNPJ: 10.929.800/0001-92
            </span>
            <span className="text-[9px] text-slate-500 leading-tight">
              Avenida Central, 1428 CEP: 29160-120, Serra-ES
            </span>
            <span className="text-[9px] text-slate-500 leading-tight">
              (27) 2141-0107 / comercial@servicelogic.com.br
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col mb-4 border-b-2 border-orange-500 pb-2">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[#1e3a8a] mb-1">
          {isUpsell ? 'PROPOSTA COMERCIAL - UPSELL' : 'PROPOSTA COMERCIAL'}
        </h1>
        <div className="flex justify-between items-end">
          <p className="text-sm font-semibold text-slate-700">
            {showBasePlan && !isUpsell ? planName : 'Adição de Módulos e Serviços'}
            {isGratuito && (
              <span className="ml-2 text-[9px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full tracking-wide">
                Gratuito
              </span>
            )}
          </p>
          <p className="text-xs font-bold text-slate-700">
            Data: <span className="font-normal">{date}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-3 rounded border border-slate-200">
          <span className="block text-[10px] text-slate-500 mb-1">Empresa</span>
          <strong className="text-slate-900 text-sm break-words block">
            {empresa || 'Não informado'}
          </strong>
          {cnpj && <span className="text-[10px] text-slate-500 mt-1 block">CNPJ: {cnpj}</span>}
        </div>
        <div className="bg-white p-3 rounded border border-slate-200">
          <span className="block text-[10px] text-slate-500 mb-1">Aos Cuidados de</span>
          <strong className="text-slate-900 text-sm break-words block">
            {aosCuidadosDe || 'Não informado'}
          </strong>
        </div>
      </div>

      {showBasePlan && !isUpsell && (
        <div className="mb-6">
          <h3 className="font-bold text-sm text-[#1e3a8a] mb-3 flex items-center gap-2">
            <div className="w-2 h-4 bg-orange-500 rounded-full" />
            Funcionalidades Inclusas no Plano Base
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categoriesToRender.map((cat, i) => (
              <div key={i} className="bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                <h4 className="font-bold text-[#1e3a8a] text-xs mb-2 pb-1 border-b border-slate-100">
                  {cat.title}
                </h4>
                <ul className="space-y-1">
                  {cat.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-1.5 text-[10px] text-slate-600 leading-tight"
                    >
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedModulesData.length > 0 && !isUpsell && (
        <div className="mb-4">
          <h3 className="font-bold text-sm text-[#1e3a8a] mb-2 flex items-center gap-2">
            <div className="w-2 h-4 bg-orange-500 rounded-full" />
            Módulos Adicionais Contratados
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedModulesData.map((mod, i) => (
              <span
                key={i}
                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200"
              >
                {mod.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {isUpsell && selectedModulesData.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-sm text-[#1e3a8a] mb-2 flex items-center gap-2">
            <div className="w-2 h-4 bg-orange-500 rounded-full" />
            Módulos e Serviços Incluídos
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedModulesData.map((mod, i) => (
              <span
                key={`mod-${i}`}
                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200"
              >
                {mod.name}
              </span>
            ))}
            {trainings
              .filter((t: any) => !t.isFree)
              .map((t: any, i: number) => (
                <span
                  key={`train-feat-${i}`}
                  className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200"
                >
                  {t.name}
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-bold text-sm text-[#1e3a8a] mb-3 flex items-center gap-2">
          <div className="w-2 h-4 bg-orange-500 rounded-full" />
          Investimento Detalhado
        </h3>
        <div className="bg-white rounded-md overflow-hidden border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5" style={{ width: '40%' }}>
                  Descrição
                </th>
                <th className="p-2.5 text-center" style={{ width: '10%' }}>
                  Qtd
                </th>
                <th className="p-2.5 text-right" style={{ width: '16%' }}>
                  V. Unitário
                </th>
                <th className="p-2.5 text-right" style={{ width: '16%' }}>
                  V. Total
                </th>
                <th className="p-2.5 text-center" style={{ width: '18%' }}>
                  Ciclo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showBasePlan && !isUpsell && (
                <tr>
                  <td className="p-2.5">
                    <span className="font-bold text-slate-800">{planName}</span>
                    <span className="text-[10px] block text-slate-500 mt-1">
                      {includedBaseModules.join(', ')}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-medium">1</td>
                  <td className="p-2.5 text-right">{formatCurrency(effectivePlanPrice)}</td>
                  <td className="p-2.5 text-right font-bold">
                    {formatCurrency(effectivePlanPrice)}
                  </td>
                  <td className="p-2.5 text-center text-slate-600">{cycleLabel}</td>
                </tr>
              )}
              {recurrentItems.map((item, idx) => {
                if (item.id === planName || item.id === 'tms-30') return null
                return (
                  <tr key={`rec-${idx}`}>
                    <td className="p-2.5">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </td>
                    <td className="p-2.5 text-center font-medium">{item.quantity || 1}</td>
                    <td className="p-2.5 text-right">
                      {formatCurrency(item.unitPrice || item.price)}
                    </td>
                    <td className="p-2.5 text-right font-bold">{formatCurrency(item.price)}</td>
                    <td className="p-2.5 text-center text-slate-600">{cycleLabel}</td>
                  </tr>
                )
              })}
              {oneTimeItems.map((item, idx) => (
                <tr key={`one-${idx}`}>
                  <td className="p-2.5">
                    <span className="font-semibold text-slate-800">
                      {item.id === 'impl-details'
                        ? `Serviços de Implantação / Configuração (${implMode})`
                        : item.name}
                    </span>
                    {item.id === 'impl-details' && (
                      <span className="text-[10px] block text-slate-500 mt-1">
                        Taxa de setup inicial
                      </span>
                    )}
                    {item.isFree && (
                      <span className="text-[9px] font-bold uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded-full ml-1">
                        Grátis
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-medium">{item.quantity || 1}</td>
                  <td className="p-2.5 text-right">
                    {item.isFree ? (
                      <span className="text-emerald-600 font-semibold">Gratuito</span>
                    ) : (
                      formatCurrency(item.unitPrice || item.price)
                    )}
                  </td>
                  <td className="p-2.5 text-right font-bold">
                    {item.isFree ? (
                      <span className="text-emerald-600">Gratuito</span>
                    ) : (
                      formatCurrency(item.price)
                    )}
                  </td>
                  <td className="p-2.5 text-center text-slate-600">Parcela Única</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-sm text-[#1e3a8a] mb-3 flex items-center gap-2">
          <div className="w-2 h-4 bg-orange-500 rounded-full" />
          Termos e Condições
        </h3>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
          <span className="text-xs text-slate-700 font-semibold">
            Ciclo de Cobrança: <span className="font-normal">{cycleLabel}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10 break-inside-avoid">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-md flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              TOTAL RECORRENTE
            </h4>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-600">Subtotal ({cycleLabel})</span>
              <span className="font-semibold">{formatCurrency(totalRecorrenteBase)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center mb-1 text-xs text-emerald-600">
                <span>Desconto</span>
                <span className="font-semibold">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
            <span className="font-bold text-[#1e3a8a]">Total {cycleLabel} Final</span>
            <span className="font-bold text-lg text-[#1e3a8a]">
              {formatCurrency(totalRecorrenteFinal)}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-md flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              TOTAL PARCELA ÚNICA
            </h4>
            {oneTimeItems
              .filter((i) => !i.isFree)
              .map((item, idx) => (
                <div key={`tot-${idx}`} className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-600">
                    {item.id === 'impl-details' ? `Implantação (${implMode})` : item.name}
                  </span>
                  <span className="font-semibold">{formatCurrency(item.price)}</span>
                </div>
              ))}
            {oneTimeItems.some((i) => i.isFree) && (
              <div className="flex justify-between items-center mb-1 text-xs text-emerald-600">
                <span>Treinamentos Gratuitos</span>
                <span className="font-semibold">Gratuito</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
            <span className="font-bold text-[#1e3a8a]">Total à Vista</span>
            <span className="font-bold text-lg text-[#1e3a8a]">{formatCurrency(totalOneTime)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-500 pt-6 border-t border-slate-200 break-inside-avoid">
        <p className="mb-1">Validade desta proposta: 15 dias corridos.</p>
        <p>Para dúvidas ou esclarecimentos, entre em contato conosco.</p>
      </div>
    </div>
  )
}
