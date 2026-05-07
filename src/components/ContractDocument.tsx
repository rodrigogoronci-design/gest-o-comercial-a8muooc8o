import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { PLANS, MODULES, DFE_TIERS, BASE_IMPLEMENTATION_HOURS } from '@/constants/contracts'

export const Highlight = ({ value, fallback }: { value: string; fallback: string }) => (
  <strong
    className={cn(
      'mx-1 px-1 rounded transition-colors',
      value
        ? 'bg-transparent font-bold text-slate-900 print:text-black'
        : 'bg-yellow-200/60 font-medium text-yellow-800 print:text-black print:bg-transparent',
    )}
  >
    {value || fallback}
  </strong>
)

export function ContractDocument({
  name,
  cnpj,
  address,
  repName,
  repCpf,
  repRg,
  selectedPlan,
  selectedModules,
  planData,
  planPrice,
  modulesPrice,
  dfeData,
  dfePrice,
  totalValue,
  implMode,
  implRate,
  totalImplHours,
  implValue,
}: any) {
  return (
    <div className="p-8 sm:p-12 text-[13px] text-slate-800 font-serif leading-relaxed space-y-5 print:p-0 print:text-black">
      <div className="flex flex-col items-center mb-8 border-b-2 border-slate-800 pb-6">
        <div className="flex w-full justify-between items-center mb-6">
          <img
            src="https://img.usecurling.com/i?q=service%20logic&shape=outline&color=blue"
            alt="Service Logic"
            className="h-14"
          />
          <h1 className="text-sm font-bold uppercase w-1/2 text-right leading-tight">
            CONTRATO DE LICENÇA DE USO E SERVIÇOS
          </h1>
        </div>
      </div>

      <div className="space-y-4 text-justify">
        <p>Pelo presente instrumento particular, de um lado:</p>
        <p className="pl-5 border-l-2 border-slate-200">
          <strong>CONTRATADA:</strong> <strong>SERVICE LOGIC - SISTEMAS DE GESTÃO LTDA</strong>,
          CNPJ nº 12.345.678/0001-99, com sede na Av. Inovação, 1000, Ed. Tech, São Paulo - SP.
        </p>
        <p className="pl-5 border-l-2 border-slate-200">
          <strong>CONTRATANTE:</strong> <Highlight value={name} fallback="[NOME DA EMPRESA]" />,
          CNPJ nº <Highlight value={cnpj} fallback="[CNPJ]" />, com sede em{' '}
          <Highlight value={address} fallback="[ENDEREÇO DA SEDE]" />, neste ato representada por{' '}
          <Highlight value={repName} fallback="[NOME DO REPRESENTANTE]" />, RG nº{' '}
          <Highlight value={repRg} fallback="[RG]" /> e CPF nº{' '}
          <Highlight value={repCpf} fallback="[CPF]" />.
        </p>

        <h3 className="font-bold uppercase mt-6 text-sm">CLÁUSULAS 1 A 4 - OBJETO E CONDIÇÕES</h3>
        <p>
          O presente contrato tem por objeto o licenciamento de uso do software comercial
          desenvolvido pela CONTRATADA, prestação de serviços de implantação, manutenção e suporte
          técnico.
        </p>

        <h3 className="font-bold uppercase mt-6 text-sm">CLÁUSULA 5 - REMUNERAÇÃO E CONDIÇÕES</h3>
        <p>
          5.1. <strong>Planos de Licenciamento (TMS):</strong>
        </p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-slate-300 p-1.5 text-left">Planos</th>
                <th className="border border-slate-300 p-1.5 text-right">Valor (R$)</th>
                <th className="border border-slate-300 p-1.5 text-center">Contratado</th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map((p) => (
                <tr
                  key={p.id}
                  className={
                    selectedPlan === p.id
                      ? 'bg-indigo-50/50 print:bg-transparent print:font-bold'
                      : ''
                  }
                >
                  <td className="border border-slate-300 p-1.5">
                    {p.name} ({p.limit})
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center text-indigo-700 print:text-black">
                    {selectedPlan === p.id ? 'X' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          5.2. <strong>Módulos Adicionais:</strong>
        </p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-slate-300 p-2 text-left">Módulo</th>
                <th className="border border-slate-300 p-2 text-right">Valor (R$)</th>
                <th className="border border-slate-300 p-2 text-center">Contratado</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr
                  key={m.id}
                  className={
                    selectedModules.includes(m.id)
                      ? 'bg-indigo-50/50 print:bg-transparent print:font-bold'
                      : ''
                  }
                >
                  <td className="border border-slate-300 p-2">{m.name}</td>
                  <td className="border border-slate-300 p-2 text-right">
                    {m.price === 0 ? 'Incluso' : formatCurrency(m.price)}
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-indigo-700 print:text-black">
                    {selectedModules.includes(m.id) ? 'X' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          5.3. <strong>Pacotes D.F.E.:</strong>
        </p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-slate-300 p-2 text-left">Pacote D.F.E.</th>
                <th className="border border-slate-300 p-2 text-right">Valor (R$)</th>
                <th className="border border-slate-300 p-2 text-center">Contratado</th>
              </tr>
            </thead>
            <tbody>
              {DFE_TIERS.map((d) => {
                const isSelected = dfeData?.id === d.id || dfeData?.name === d.name
                return (
                  <tr
                    key={d.id}
                    className={
                      isSelected ? 'bg-indigo-50/50 print:bg-transparent print:font-bold' : ''
                    }
                  >
                    <td className="border border-slate-300 p-2">{d.name}</td>
                    <td className="border border-slate-300 p-2 text-right">
                      {d.price === 0 ? 'Não Contratado' : formatCurrency(d.price)}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-indigo-700 print:text-black">
                      {isSelected ? 'X' : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          5.4. <strong>Implantação ({implMode === 'remoto' ? 'Remota' : 'Presencial'}):</strong>
        </p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-slate-300 p-2 text-left">Item</th>
                <th className="border border-slate-300 p-2 text-center w-16">Horas</th>
                <th className="border border-slate-300 p-2 text-right w-32">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2">Básicos</td>
                <td className="border border-slate-300 p-2 text-center">
                  {BASE_IMPLEMENTATION_HOURS}
                </td>
                <td className="border border-slate-300 p-2 text-right">
                  {formatCurrency(BASE_IMPLEMENTATION_HOURS * implRate)}
                </td>
              </tr>
              {selectedModules.map((mId: string) => {
                const mod = MODULES.find((m) => m.id === mId)
                if (!mod || !mod.implHours) return null
                return (
                  <tr key={mId}>
                    <td className="border border-slate-300 p-2">{mod.name}</td>
                    <td className="border border-slate-300 p-2 text-center">{mod.implHours}</td>
                    <td className="border border-slate-300 p-2 text-right">
                      {formatCurrency(mod.implHours * implRate)}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-slate-50 font-bold print:bg-slate-200">
                <td className="border border-slate-300 p-2 uppercase text-right">
                  Total Implantação
                </td>
                <td className="border border-slate-300 p-2 text-center">{totalImplHours}</td>
                <td className="border border-slate-300 p-2 text-right">
                  {formatCurrency(implValue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          5.5. <strong>Resumo Financeiro (Mensalidade):</strong> Vencimento dia 10.
        </p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2">Plano Base ({planData?.name})</td>
                <td className="border border-slate-300 p-2 text-right">
                  {formatCurrency(planPrice)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Módulos ({selectedModules.length})</td>
                <td className="border border-slate-300 p-2 text-right">
                  {formatCurrency(modulesPrice)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Pacote D.F.E. ({dfeData?.name})</td>
                <td className="border border-slate-300 p-2 text-right">
                  {formatCurrency(dfePrice)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold print:bg-slate-200">
                <td className="border border-slate-300 p-2 uppercase text-right">Total Mensal</td>
                <td className="border border-slate-300 p-2 text-right">
                  {formatCurrency(totalValue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center space-y-10">
          <p>E por estarem justos e contratados, assinam eletronicamente.</p>
          <div className="grid grid-cols-2 gap-8 mt-10">
            <div className="border-t border-slate-800 pt-2 text-center">
              <p className="font-bold">SERVICE LOGIC LTDA</p>
              <p className="text-[11px] text-slate-500">CONTRATADA</p>
            </div>
            <div className="border-t border-slate-800 pt-2 text-center">
              <p className="font-bold uppercase">
                <Highlight value={name} fallback="[NOME DA EMPRESA]" />
              </p>
              <p className="text-[11px] text-slate-500">CONTRATANTE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
