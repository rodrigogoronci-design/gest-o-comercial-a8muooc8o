import React from 'react'
import { formatCurrency } from '@/lib/formatters'
import { MODULES } from '@/constants/contracts'
import logoUrl from '@/assets/logomarca-service-fde06.png'

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
    <div className="bg-white text-black p-10 text-sm max-w-[210mm] mx-auto border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 font-sans leading-relaxed">
      {/* HEADER */}
      <div className="flex flex-col items-center mb-8 border-b-2 border-slate-800 pb-6 print:break-inside-avoid">
        <img
          src={logoUrl}
          alt="Service Logic Logo"
          className="h-16 mb-4 object-contain print:h-20"
        />
        <h1 className="text-xl font-bold uppercase tracking-wider text-center print:text-black">
          Termo Aditivo de Contrato de Prestação de Serviços
        </h1>
      </div>

      <div className="space-y-6 text-justify">
        {/* 1. DAS PARTES */}
        <section className="print:break-inside-avoid">
          <h2 className="font-bold text-base mb-2">1. QUALIFICAÇÃO DAS PARTES</h2>
          <div className="space-y-2">
            <p>
              <span className="font-bold">CONTRATADA:</span> CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA,
              pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 27.751.577/0001-91, com
              sede na Rua Paulo de Vasconcelos, nº 429, Maria Ortiz, Vitória-ES - CEP 29.070-364.
            </p>
            <p>
              <span className="font-bold">CONTRATANTE:</span> {name || '__________________________'}
              , inscrita no CNPJ sob o nº {cnpj || '______________'}, com sede em{' '}
              {address || '__________________________'}, neste ato representada por{' '}
              {repName || '__________________________'}, CPF {repCpf || '______________'}, RG{' '}
              {repRg || '______________'}.
            </p>
          </div>
        </section>

        {/* 2. DO OBJETO E COMPARAÇÃO */}
        <section className="print:break-inside-avoid">
          <h2 className="font-bold text-base mb-2">2. DO OBJETO</h2>
          <p className="mb-4">
            O presente termo aditivo tem por objeto a inclusão de novos módulos, franquias e/ou
            serviços ao contrato principal de prestação de serviços de licença de uso de software
            firmado entre as partes, passando a vigorar com a nova configuração descrita abaixo:
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-slate-300 p-4">
              <h3 className="font-bold text-sm mb-2 text-slate-800">Configuração Atual (De)</h3>
              <ul className="list-disc pl-4 text-sm space-y-1">
                <li>
                  <strong>Plano Base:</strong> {currentPlan}
                </li>
                {currentAdicionais.map((item: any, idx: number) => (
                  <li key={idx}>Módulo: {item.name || item.id}</li>
                ))}
                {currentAdicionais.length === 0 && <li>Sem módulos adicionais</li>}
              </ul>
            </div>

            <div className="border border-slate-300 p-4">
              <h3 className="font-bold text-sm mb-2 text-slate-800">
                Configuração Adicionada (Para)
              </h3>
              <ul className="list-disc pl-4 text-sm space-y-1">
                {selectedModules &&
                  selectedModules.map((id: string) => {
                    const m = MODULES.find((mod) => mod.id === id)
                    if (!m) return null
                    return (
                      <li key={m.id}>
                        {m.name} - {formatCurrency(m.price)} / mês
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
                {hasNoNewItems && <li className="italic text-slate-500">Nenhum item adicional.</li>}
              </ul>
            </div>
          </div>
        </section>

        {/* 3. DOS VALORES E CONDIÇÕES COMERCIAIS */}
        <section className="print:break-inside-avoid">
          <h2 className="font-bold text-base mb-2">3. DOS VALORES E CONDIÇÕES FINANCEIRAS</h2>
          <p className="mb-3">
            Em decorrência das adições especificadas na Cláusula 2, os valores contratuais mensais
            passam a compor o seguinte quadro financeiro consolidado:
          </p>

          <table className="w-full text-left border-collapse border border-slate-300 mb-4">
            <tbody className="divide-y divide-slate-300 text-sm">
              <tr>
                <td className="p-3 border-r border-slate-300 w-2/3">
                  Valor da Mensalidade do Contrato Atual
                </td>
                <td className="p-3 font-medium">{formatCurrency(currentContract)}</td>
              </tr>
              <tr>
                <td className="p-3 border-r border-slate-300">Valor dos Novos Serviços/Módulos</td>
                <td className="p-3 font-medium">{formatCurrency(newTotalMensal)}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td className="p-3 border-r border-slate-300 text-red-600">
                    Desconto Concedido nos Novos Itens
                  </td>
                  <td className="p-3 text-red-600 font-medium">- {formatCurrency(discount)}</td>
                </tr>
              )}
              <tr className="bg-slate-100 font-bold">
                <td className="p-3 border-r border-slate-300 uppercase">
                  Novo Valor Mensal Consolidado
                </td>
                <td className="p-3">{formatCurrency(finalSum)}</td>
              </tr>
            </tbody>
          </table>

          {implValue > 0 && (
            <p className="mb-3 text-sm">
              Fica ajustado o pagamento de <strong>{formatCurrency(implValue)}</strong> referente à
              taxa única de serviços de implantação/treinamento (Modalidade:{' '}
              {implMode === 'remoto' ? 'Remota' : 'Presencial'}).
            </p>
          )}

          {isencaoPeriodo > 0 && (
            <p className="mb-3 text-sm font-bold bg-yellow-50 p-3 border border-yellow-200">
              Concede-se o período de carência/isenção de {isencaoPeriodo}{' '}
              {isencaoPeriodo === 1 ? 'mês' : 'meses'} sobre os novos itens contratados. O valor da
              nova mensalidade passará a ser de {formatCurrency(finalSum)} após o período de
              gratuidade. Durante o período de carência, será cobrado apenas o valor do contrato
              atual de {formatCurrency(currentContract)}.
            </p>
          )}

          {prazosConcedidos && (
            <p className="mb-3 text-sm">
              <span className="font-bold">Condições Especiais: </span>
              {prazosConcedidos}
            </p>
          )}
        </section>

        {/* 4. DISPOSIÇÕES GERAIS */}
        <section className="print:break-inside-avoid">
          <h2 className="font-bold text-base mb-2">4. DAS DISPOSIÇÕES GERAIS</h2>
          <p>
            Permanecem inalteradas e em pleno vigor todas as demais cláusulas e condições do
            Contrato Principal de Licença de Uso de Software firmado entre as partes que não tenham
            sido expressamente modificadas pelo presente instrumento aditivo.
          </p>
        </section>

        <p className="text-center mt-12 mb-16">
          {date
            ? `Vitória/ES, ${date}.`
            : `Vitória/ES, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`}
        </p>

        {/* ASSINATURAS */}
        <div className="flex flex-col sm:flex-row justify-between gap-12 mt-12 pb-8 print:break-inside-avoid">
          <div className="flex-1 text-center">
            <div className="border-t border-black w-full mb-2"></div>
            <p className="font-bold text-sm uppercase">CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA</p>
            <p className="text-xs">CNPJ: 27.751.577/0001-91</p>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t border-black w-full mb-2"></div>
            <p className="font-bold text-sm uppercase">{name || 'CONTRATANTE'}</p>
            <p className="text-xs">CNPJ: {cnpj || '___.___.___/____-__'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
