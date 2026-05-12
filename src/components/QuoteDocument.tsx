import { formatCurrency } from '@/lib/formatters'

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
}: QuoteDocumentProps) {
  return (
    <div className="bg-white w-full max-w-[210mm] mx-auto print:m-0 print:p-0 text-slate-800 text-sm shadow-sm print:shadow-none font-sans">
      {/* PAGE 1 */}
      <div
        className="break-after-page min-h-[297mm] p-12 relative flex flex-col bg-[#eef2f6] print:bg-[#eef2f6] print:break-after-page"
        style={
          { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties
        }
      >
        {/* Background shape */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-[#d0dbe7] rounded-l-[100%] opacity-50 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-6 mt-12 mb-32 relative z-10">
          <div className="flex items-center justify-center w-20 h-20 bg-orange-500 rounded-full text-white font-bold text-5xl shrink-0">
            S
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-[#1e3a8a] tracking-tight leading-none mb-1">
              SERVICE
            </h2>
            <h2 className="text-3xl font-extrabold text-[#1e3a8a] tracking-tight leading-none mb-2">
              LOGIC
            </h2>
            <div className="text-xs text-slate-600 leading-tight space-y-0.5 mt-2">
              <p>SERVICE LOGIC, CNPJ: 10.929.600/0001-92</p>
              <p>ENDEREÇO: Avenida Central, 1439 CEP: 29165-130, Serra-ES</p>
              <p>CONTATO: (27) 99879-6306 / comercial@servicelogic.com.br</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10 border-l-[6px] border-orange-500 pl-8 mb-20">
          <h1 className="text-[3.5rem] font-bold text-[#1e3a8a] leading-tight">
            Proposta <br /> Comercial
          </h1>
        </div>

        {/* Info */}
        <div className="relative z-10 space-y-6 text-2xl font-bold text-[#1e3a8a] mb-32">
          <p>{date}</p>
          <p>{planName}</p>
        </div>

        {/* Client */}
        <div className="relative z-10 space-y-4 text-xl font-semibold text-[#1e3a8a] border-l-[4px] border-[#1e3a8a] pl-6 mt-auto mb-12">
          <p>Empresa: {empresa || '_________________________'}</p>
          <p>Aos Cuidados de: {aosCuidadosDe || '_________________________'}</p>
        </div>
      </div>

      {/* PAGE 2 */}
      <div
        className="break-after-page min-h-[297mm] p-12 bg-[#f8fafc] print:bg-[#f8fafc] print:break-after-page flex flex-col"
        style={
          { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-4 mb-12 shrink-0">
          <div className="w-2 h-12 bg-orange-500 rounded-full" />
          <h2 className="text-4xl font-bold text-[#1e3a8a]">
            Conheça + <br /> Funcionalidades
          </h2>
          <div className="ml-auto text-[#1e3a8a] font-bold text-2xl flex items-center gap-2">
            <span className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center">
              S
            </span>
            SERVICE LOGIC
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
          {FEATURE_CATEGORIES.map((cat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4 text-center border-b pb-2">
                {cat.title}
              </h3>
              <ul className="space-y-2 flex-1">
                {cat.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                    <span className="text-emerald-500 font-bold shrink-0">√</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 font-bold text-sm bg-white p-4 rounded-xl border border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-emerald-600">
            <span className="text-xl">√</span> Incluso
          </div>
          <div className="flex items-center gap-2 text-rose-500">
            <span className="text-xl">X</span> Não Incluso
          </div>
        </div>
      </div>

      {/* PAGE 3 */}
      <div
        className="break-after-page min-h-[297mm] p-12 bg-[#f8fafc] print:bg-[#f8fafc] print:break-after-page"
        style={
          { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="w-2 h-12 bg-orange-500 rounded-full" />
          <h2 className="text-4xl font-bold text-[#1e3a8a]">Proposta Detalhada</h2>
          <div className="ml-auto text-[#1e3a8a] font-bold text-2xl flex items-center gap-2">
            <span className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center">
              S
            </span>
            SERVICE LOGIC
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 mb-16">
          <table className="w-full text-left">
            <thead className="bg-[#e2e8f0] text-slate-700 font-bold text-sm">
              <tr>
                <th className="p-4">Descrição do Produto</th>
                <th className="p-4 text-center">Quantidade</th>
                <th className="p-4 text-right">Valor unitário</th>
                <th className="p-4 text-right">Valor Total</th>
                <th className="p-4 text-center">Forma de Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr>
                <td className="p-4 font-semibold text-slate-800">
                  {planName}
                  <div className="text-xs font-normal text-slate-500 mt-1">
                    Administração, Básico, Carga, Faturamento e Financeiro
                  </div>
                </td>
                <td className="p-4 text-center font-medium">1</td>
                <td className="p-4 text-right font-medium">{formatCurrency(planPrice)}</td>
                <td className="p-4 text-right font-medium">{formatCurrency(planPrice)}</td>
                <td className="p-4 text-center text-slate-600">Mensalidade</td>
              </tr>
              {selectedModules.length > 0 && (
                <tr>
                  <td className="p-4 font-semibold text-slate-800">
                    Módulos Adicionais
                    <div className="text-xs font-normal text-slate-500 mt-1">
                      {selectedModules.join(', ')}
                    </div>
                  </td>
                  <td className="p-4 text-center font-medium">1</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(modulesPrice)}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(modulesPrice)}</td>
                  <td className="p-4 text-center text-slate-600">Mensalidade</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-16 flex items-center gap-4 mb-8">
          <div className="w-2 h-12 bg-orange-500 rounded-full" />
          <h2 className="text-4xl font-bold text-[#1e3a8a]">Valor Final</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-500 mb-6 uppercase tracking-wider text-xs">
              Total Mensalidade
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-slate-700">
                <span>Plano Recorrente</span>
                <span className="font-bold">{formatCurrency(planPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Módulos Adicionais</span>
                <span className="font-bold">{formatCurrency(modulesPrice)}</span>
              </div>
              <div className="pt-4 border-t flex justify-between items-center text-2xl font-bold text-[#1e3a8a]">
                <span>Total</span>
                <span>{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-500 mb-6 uppercase tracking-wider text-xs">
              Total Parcela Única
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-slate-700">
                <span>Serviços Únicos</span>
                <span className="font-bold">R$ 0,00</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Implantação ({implMode})</span>
                <span className="font-bold">{formatCurrency(implValue)}</span>
              </div>
              <div className="pt-4 border-t flex justify-between items-center text-2xl font-bold text-[#1e3a8a]">
                <span>Total</span>
                <span>{formatCurrency(implValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
