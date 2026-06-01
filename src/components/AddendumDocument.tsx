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

  const currentPlan = props.currentClientModules?.plano_base || 'Plano Atual (Não Especificado)'
  const currentAdicionais = Array.isArray(props.currentClientModules?.adicionais)
    ? props.currentClientModules.adicionais
    : []

  const hasNoNewItems =
    (!selectedModules || selectedModules.length === 0) &&
    (!trainings || trainings.length === 0) &&
    additionalPlates === 0 &&
    additionalBranches === 0 &&
    selectedDfe === 'dfe-none'

  return (
    <div className="bg-white text-slate-900 p-10 text-sm max-w-[210mm] mx-auto border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 font-sans">
      {/* HEADER */}
      <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-indigo-900">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            CS
          </div>
          <div>
            <h1 className="text-2xl font-black text-indigo-900 tracking-tight uppercase">
              Aditivo Contratual
            </h1>
            <p className="text-slate-500 text-sm mt-1">Atualização de Serviços e Módulos</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 space-y-1 mt-1">
          <p>
            <strong>Data:</strong> {date}
          </p>
          <p>
            <strong>Ref:</strong> Contrato Principal
          </p>
        </div>
      </header>

      <div className="space-y-6 text-justify leading-relaxed">
        {/* 1. DAS PARTES */}
        <section>
          <h2 className="font-bold text-lg text-indigo-900 mb-3 border-b border-slate-200 pb-1">
            1. Qualificação das Partes
          </h2>
          <div className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-100">
            <p className="text-sm">
              <span className="font-bold text-slate-800">CONTRATADA:</span> CONTACTO SOLUÇÕES EM
              TECNOLOGIA - LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº
              27.751.577/0001-91, com sede na Rua Paulo de Vasconcelos, nº 429, Maria Ortiz,
              Vitoria-ES - CEP 29.070-364.
            </p>
            <p className="text-sm">
              <span className="font-bold text-slate-800">CONTRATANTE:</span>{' '}
              {name || '__________________________'}, inscrita no CNPJ sob o nº{' '}
              {cnpj || '______________'}, com sede em {address || '__________________________'},
              representada por {repName || '__________________________'}, CPF{' '}
              {repCpf || '______________'}, RG {repRg || '______________'}.
            </p>
          </div>
        </section>

        {/* 2. DO OBJETO E COMPARAÇÃO */}
        <section>
          <h2 className="font-bold text-lg text-indigo-900 mb-3 border-b border-slate-200 pb-1">
            2. Do Objeto e Configuração do Sistema
          </h2>
          <p className="mb-4 text-sm text-slate-700">
            O presente termo aditivo tem por objeto a inclusão de novos módulos e serviços ao
            contrato principal vigente, passando a vigorar com a nova configuração descrita abaixo:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-md">
              <h3 className="font-bold text-sm text-slate-700 mb-2">Configuração Atual</h3>
              <ul className="list-disc pl-5 text-sm space-y-1 text-slate-600">
                <li>
                  <strong>Plano Base:</strong> {currentPlan}
                </li>
                {currentAdicionais.map((item: any, idx: number) => (
                  <li key={idx}>Módulo: {item.name || item.id}</li>
                ))}
                {currentAdicionais.length === 0 && <li>Sem módulos adicionais</li>}
              </ul>
            </div>

            <div className="bg-indigo-50 p-4 border border-indigo-200 rounded-md">
              <h3 className="font-bold text-sm text-indigo-800 mb-2">
                Novos Itens Adicionados (Upsell)
              </h3>
              <ul className="list-disc pl-5 text-sm space-y-1 text-indigo-700">
                {selectedModules &&
                  selectedModules.map((id: string) => {
                    const m = MODULES.find((mod) => mod.id === id)
                    if (!m) return null
                    return (
                      <li key={m.id}>
                        {m.name} - {formatCurrency(m.price)} / mês
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
                {hasNoNewItems && (
                  <li className="text-indigo-500 italic">
                    Nenhum módulo ou serviço adicional selecionado.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* 3. DOS VALORES E CONDIÇÕES COMERCIAIS */}
        <section>
          <h2 className="font-bold text-lg text-indigo-900 mb-3 border-b border-slate-200 pb-1">
            3. Quadro Resumo Financeiro
          </h2>

          <div className="border border-slate-300 rounded-md overflow-hidden my-4 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-sm">
                <tr>
                  <th className="p-3 border-b border-slate-300 font-bold text-slate-700">
                    Descrição dos Valores
                  </th>
                  <th className="p-3 border-b border-slate-300 text-right font-bold text-slate-700 w-48">
                    Valor Mensal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                <tr>
                  <td className="p-3 font-medium text-slate-600">Valor da Mensalidade Atual</td>
                  <td className="p-3 text-right font-medium text-slate-600">
                    {formatCurrency(currentContract)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-indigo-600">Valor dos Novos Módulos</td>
                  <td className="p-3 text-right font-medium text-indigo-600">
                    {formatCurrency(newTotalMensal)}
                  </td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td className="p-3 font-medium text-red-600">
                      Desconto Aplicado sobre os Novos Módulos
                    </td>
                    <td className="p-3 text-right font-medium text-red-600">
                      - {formatCurrency(discount)}
                    </td>
                  </tr>
                )}
                <tr className="bg-indigo-900 text-white font-bold text-base">
                  <td className="p-4">Novo Valor Total da Mensalidade</td>
                  <td className="p-4 text-right">{formatCurrency(finalSum)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-md text-sm">
              <h4 className="font-bold text-orange-800 mb-1">
                Serviços de Implantação (Taxa Única)
              </h4>
              <p className="text-orange-900 font-medium text-lg mb-1">
                {formatCurrency(implValue)}
              </p>
              <p className="text-orange-700 text-xs">
                Modalidade: {implMode === 'remoto' ? 'Remota' : 'Presencial'}
              </p>
            </div>
            {isencaoPeriodo > 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-sm">
                <h4 className="font-bold text-emerald-800 mb-1">Período de Carência / Isenção</h4>
                <p className="text-emerald-900 font-medium text-lg mb-1">
                  {isencaoPeriodo} {isencaoPeriodo === 1 ? 'mês' : 'meses'}
                </p>
                <p className="text-emerald-700 text-xs">
                  Aplicado sobre o valor dos novos módulos.
                </p>
              </div>
            )}
          </div>
        </section>

        {prazosConcedidos && (
          <section>
            <h2 className="font-bold text-lg text-indigo-900 mb-3 border-b border-slate-200 pb-1">
              4. Condições Especiais / Prazos Concedidos
            </h2>
            <div className="p-4 bg-slate-50 border-l-4 border-indigo-500 text-slate-800 italic text-sm rounded-r-md">
              "{prazosConcedidos}"
            </div>
          </section>
        )}

        {/* 4/5. DISPOSIÇÕES GERAIS */}
        <section>
          <h2 className="font-bold text-lg text-indigo-900 mb-3 border-b border-slate-200 pb-1">
            {prazosConcedidos ? '5' : '4'}. Disposições Gerais
          </h2>
          <p className="text-sm text-slate-700">
            Permanecem inalteradas e em pleno vigor todas as demais cláusulas e condições do
            Contrato Principal firmado entre as partes que não tenham sido expressamente modificadas
            pelo presente instrumento aditivo.
          </p>
        </section>

        {/* ASSINATURAS */}
        <div className="mt-16 flex flex-col sm:flex-row justify-between gap-12 pt-8">
          <div className="flex-1 text-center">
            <div className="border-t border-slate-400 w-full mb-3"></div>
            <p className="font-bold text-sm text-slate-800">
              CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA
            </p>
            <p className="text-xs text-slate-500">CNPJ: 27.751.577/0001-91</p>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t border-slate-400 w-full mb-3"></div>
            <p className="font-bold text-sm text-slate-800">{name || 'CONTRATANTE'}</p>
            <p className="text-xs text-slate-500">CNPJ: {cnpj || '___.___.___/____-__'}</p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
          <p>
            Documento gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR')}
          </p>
          <p>Vitória/ES</p>
        </footer>
      </div>
    </div>
  )
}
