import { formatCurrency } from '@/lib/formatters'
import logoUrl from '@/assets/logomarca-service-ea011.png'

interface QuoteDocumentProps {
  empresa: string
  aosCuidadosDe: string
  date: string
  planName: string
  selectedModules: string[]
  planPrice: number
  modulesPrice: number
  totalValue: number
  implMode: string
  implRate: number
  totalImplHours: number
  implValue: number
  isUpsell?: boolean
  includeFranchise?: boolean
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
  selectedModules,
  planPrice,
  modulesPrice,
  totalValue,
  implMode,
  implValue,
  isUpsell,
  includeFranchise,
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
      {showBasePlan && (
        <div className="mb-4">
          <h3 className="font-bold text-xs text-[#1e3a8a] mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-3 bg-orange-500 rounded-full" />
            Funcionalidades Inclusas no Plano
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
              {showBasePlan && (
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
              {selectedModules.length > 0 && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">Módulos Adicionais</span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      {selectedModules.join(', ')}
                    </span>
                    {selectedModules.some((m) => m.includes('EDI')) && (
                      <span className="text-[9px] block text-slate-500 mt-1.5 italic border-t border-slate-100 pt-1">
                        <strong>* EDI (Electronic Data Interchange):</strong> Inclusão de Layout
                        padrão Proceda para integração (arquivos NOTFIS para emissão de CT-e, envios
                        de CONEMB, DOCCOB e OCOREN) automatizando a troca de informações entre
                        embarcador e transportadora.
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">{formatCurrency(modulesPrice)}</td>
                  <td className="p-1.5 text-right font-medium">{formatCurrency(modulesPrice)}</td>
                  <td className="p-1.5 text-center text-slate-600">Mensalidade</td>
                </tr>
              )}
              {includeFranchise && (
                <tr>
                  <td className="p-1.5">
                    <span className="font-semibold text-slate-800">
                      Franquia de Emissões (DF-e)
                    </span>
                    <span className="text-[9px] block text-slate-500 mt-0.5">
                      Pacote de emissões eletrônicas
                    </span>
                  </td>
                  <td className="p-1.5 text-center font-medium">1</td>
                  <td className="p-1.5 text-right">Incluso</td>
                  <td className="p-1.5 text-right font-medium">Incluso</td>
                  <td className="p-1.5 text-center text-slate-600">-</td>
                </tr>
              )}
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
          <div className="space-y-1.5 text-[10px]">
            {showBasePlan && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Plano Base</span>
                <span className="font-medium">{formatCurrency(planPrice)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600">
              <span>Módulos Adicionais</span>
              <span className="font-medium">{formatCurrency(modulesPrice)}</span>
            </div>
            <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
              <span>Total Mensal</span>
              <span>{formatCurrency(totalValue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-200">
          <h4 className="font-bold text-slate-500 text-[9px] uppercase tracking-wider mb-2">
            Total Parcela Única
          </h4>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center text-slate-600">
              <span>Serviços Únicos</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            {!isUpsell && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Implantação ({implMode})</span>
                <span className="font-medium">{formatCurrency(implValue)}</span>
              </div>
            )}
            <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-[#1e3a8a] text-xs">
              <span>Total à Vista</span>
              <span>{isUpsell ? formatCurrency(0) : formatCurrency(implValue)}</span>
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
