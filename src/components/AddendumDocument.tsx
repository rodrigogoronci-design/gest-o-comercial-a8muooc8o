import React from 'react'
import { formatCurrency } from '@/lib/formatters'
import { MODULES } from '@/constants/contracts'

export function AddendumDocument(props: any) {
  const {
    name,
    cnpj,
    address,
    repName,
    repCpf,
    repRg,
    selectedModules,
    selectedDfe,
    dfeData,
    dfePrice,
    totalValue,
    totalValueStandard,
    valor_mensalidade,
    valor_total,
    implMode,
    implValue,
    trainings,
    additionalPlates,
    additionalPlatesTotal,
    additionalBranches,
    additionalBranchesTotal,
    calculatedDiscount,
    isencaoPeriodo,
    moduleGracePeriods,
    prazosConcedidos,
    currentContractValue,
    date = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  } = props

  const currentContract = Number(currentContractValue ?? valor_total ?? 0)
  const newTotalMensal = Number(valor_mensalidade ?? totalValueStandard ?? 0)
  const discount = Number(calculatedDiscount ?? 0)

  let finalTotalMensal = Number(totalValue ?? 0)
  // Ensures calculation resilience if totalValue is unexpectedly passed as 0 when it shouldn't be
  if (finalTotalMensal === 0 && newTotalMensal > 0 && discount === 0) {
    finalTotalMensal = newTotalMensal
  } else if (finalTotalMensal === 0 && newTotalMensal > 0 && discount > 0) {
    finalTotalMensal = Math.max(0, newTotalMensal - discount)
  }

  const finalSum = currentContract + finalTotalMensal

  return (
    <div className="bg-white text-black p-8 text-sm max-w-4xl mx-auto border border-slate-200 shadow-sm print:shadow-none print:border-none">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase underline">
          Aditivo Contratual de Prestação de Serviços
        </h1>
        <p className="text-sm mt-2">Referente à adição de módulos e serviços complementares.</p>
      </div>

      <div className="space-y-4 text-justify leading-relaxed">
        <section>
          <h2 className="font-bold text-base mb-2">1. Das Partes</h2>
          <p>
            <strong>CONTRATADA:</strong> CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA, pessoa jurídica de
            direito privado, inscrita no CNPJ sob o nº 27.751.577/0001-91, com sede na Rua Paulo de
            Vasconcelos, nº 429, Maria Ortiz, Vitoria-ES - CEP 29.070-364.
          </p>
          <p className="mt-2">
            <strong>CONTRATANTE:</strong> {name || '__________________________'}, inscrita no CNPJ
            sob o nº {cnpj || '______________'}, com sede em{' '}
            {address || '__________________________'}, representada por{' '}
            {repName || '__________________________'}, CPF {repCpf || '______________'}, RG{' '}
            {repRg || '______________'}.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">2. Do Objeto</h2>
          <p>
            O presente termo aditivo tem por objeto a inclusão dos seguintes módulos e serviços ao
            contrato principal vigente:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            {selectedModules &&
              selectedModules.map((id: string) => {
                const m = MODULES.find((mod) => mod.id === id)
                if (!m) return null
                return (
                  <li key={m.id}>
                    Módulo: {m.name} - {formatCurrency(m.price)} / mês
                    {moduleGracePeriods && moduleGracePeriods[m.id]
                      ? ` (Gratuidade de ${moduleGracePeriods[m.id]} meses)`
                      : ''}
                  </li>
                )
              })}
            {dfeData && dfeData.id !== 'dfe-none' && (
              <li>
                Pacote DF-e: {dfeData.name} - {formatCurrency(dfePrice)} / mês
              </li>
            )}
            {additionalPlates > 0 && (
              <li>
                Placas Adicionais: {additionalPlates} placa(s) -{' '}
                {formatCurrency(additionalPlatesTotal)} / mês
              </li>
            )}
            {additionalBranches > 0 && (
              <li>
                Filiais Adicionais: {additionalBranches} filial(is) -{' '}
                {formatCurrency(additionalBranchesTotal)} / mês
              </li>
            )}
            {trainings &&
              trainings.length > 0 &&
              trainings.map((t: any) => (
                <li key={t.id}>
                  Treinamento Adicional: {t.name} -{' '}
                  {t.isFree ? 'CORTESIA' : formatCurrency(t.price)}
                </li>
              ))}
            {(!selectedModules || selectedModules.length === 0) &&
              (!trainings || trainings.length === 0) &&
              additionalPlates === 0 &&
              additionalBranches === 0 &&
              selectedDfe === 'dfe-none' && (
                <li className="text-slate-500 italic">
                  Nenhum módulo ou serviço adicional selecionado.
                </li>
              )}
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">3. Dos Valores e Condições Comerciais</h2>
          <div className="border border-slate-300 rounded-md overflow-hidden my-4">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-sm">
                <tr>
                  <th className="p-2 border-b border-slate-300">Descrição</th>
                  <th className="p-2 border-b border-slate-300 text-right">Valor Mensal</th>
                </tr>
              </thead>
              <tbody>
                {currentContract > 0 && (
                  <tr>
                    <td className="p-2 border-b border-slate-200">Mensalidade Contrato Atual</td>
                    <td className="p-2 border-b border-slate-200 text-right">
                      {formatCurrency(currentContract)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="p-2 border-b border-slate-200">Total de Adicionais (Padrão)</td>
                  <td className="p-2 border-b border-slate-200 text-right">
                    {formatCurrency(newTotalMensal)}
                  </td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td className="p-2 border-b border-slate-200 text-red-600">
                      Desconto Aplicado
                    </td>
                    <td className="p-2 border-b border-slate-200 text-right text-red-600">
                      - {formatCurrency(discount)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2">Novo Valor Final da Mensalidade</td>
                  <td className="p-2 text-right text-lg text-indigo-700">
                    {formatCurrency(finalSum)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-medium text-sm mt-4">
            A partir desta adesão, a nova mensalidade total do contrato passará a ser de{' '}
            {formatCurrency(finalSum)}.
          </div>

          <div className="space-y-2 mt-4">
            <p>
              <strong>Taxa de Implantação/Serviços (Única):</strong> {formatCurrency(implValue)} (
              {implMode})
            </p>
            {isencaoPeriodo > 0 && (
              <p>
                <strong>Período de Isenção da Mensalidade:</strong> {isencaoPeriodo} meses sobre o
                valor do aditivo.
              </p>
            )}
          </div>
        </section>

        {prazosConcedidos && (
          <section>
            <h2 className="font-bold text-base mb-2">4. Condições Especiais / Prazos Concedidos</h2>
            <div className="p-4 bg-slate-50 border-l-4 border-orange-400 text-slate-800 italic">
              "{prazosConcedidos}"
            </div>
          </section>
        )}

        <section>
          <h2 className="font-bold text-base mb-2">
            {prazosConcedidos ? '5' : '4'}. Disposições Gerais
          </h2>
          <p>
            Permanecem inalteradas e em pleno vigor as demais cláusulas e condições do Contrato
            Original que não foram expressamente modificadas pelo presente instrumento.
          </p>
        </section>

        <div className="mt-16 flex flex-col sm:flex-row justify-between gap-8 pt-8 border-t border-slate-200">
          <div className="flex-1 text-center">
            <div className="border-t border-black w-full mb-2"></div>
            <p className="font-bold">CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA</p>
            <p className="text-xs">CNPJ: 27.751.577/0001-91</p>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t border-black w-full mb-2"></div>
            <p className="font-bold">{name || 'CONTRATANTE'}</p>
            <p className="text-xs">CNPJ: {cnpj || '___.___.___/____-__'}</p>
          </div>
        </div>

        <p className="text-right text-xs mt-8 text-slate-500">Vitória/ES, {date}.</p>
      </div>
    </div>
  )
}
