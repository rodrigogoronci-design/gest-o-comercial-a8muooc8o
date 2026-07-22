import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { PLANS, MODULES as BASE_MODULES, BASE_IMPLEMENTATION_HOURS } from '@/constants/contracts'

const MODULES = [...BASE_MODULES]
import { CONTRACT_TEXT } from '@/constants/contract-text'
import logoUrl from '@/assets/logomarca-service-ea011.png'
import { getPlanIncludedModuleNames, getPlanDefaultModules } from '@/lib/plan-modules'

export const Highlight = ({ value, fallback }: { value: string; fallback: string }) => (
  <strong
    className={cn(
      'mx-1 px-1 rounded transition-colors',
      value
        ? 'bg-transparent font-bold text-[#1b4382]'
        : 'bg-[#f37021]/20 font-medium text-[#f37021]',
    )}
  >
    {value || fallback}
  </strong>
)

const ClauseBlock = ({ title, texts }: { title: string; texts: string[] }) => (
  <div className="mb-6">
    <h3 className="font-bold uppercase mt-6 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3">
      {title}
    </h3>
    <div className="space-y-3">
      {texts.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  </div>
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
  selectedDfe,
  dfeData,
  dfePrice,
  totalValue,
  implMode,
  implRate,
  totalImplHours,
  implValue,
  trainings,
  includeDiagnosticVisit,
  diagnosticVisitValue,
  diagnosticVisitDate,
  diagnosticVisits = [],
  additionalPlates,
  additionalPlatesPrice,
  additionalPlatesTotal,
  additionalBranches,
  additionalBranchesPrice,
  additionalBranchesTotal,
  filiais = [],
  descontoMensalidade = 0,
  tipoDesconto = 'valor',
  calculatedDiscount = 0,
  isencaoPeriodo = 0,
  moduleGracePeriods = {},
  totalValueStandard = 0,
  prazosConcedidos,
  customModulePrices = {},
  planBilling = 'mensal',
  planAnnualPrice = 0,
  moduleBilling = {},
  customModuleAnnualPrices = {},
  dfeBilling = 'mensal',
  dfeAnnualPrice = 0,
  cobrarDfePorFilial = false,
  quantidadeFiliaisDfe = 1,
  platesBilling = 'mensal',
  platesAnnualPrice = 0,
  branchesBilling = 'mensal',
  branchesAnnualPrice = 0,
  totalAnual = 0,
  totalAnualStandard = 0,
  parcelasImplantacao = 1,
}: any) {
  return (
    <div className="p-8 sm:p-12 text-[12px] text-slate-800 font-serif leading-relaxed space-y-5 print:p-0">
      <div className="flex flex-col items-center mb-8 border-b-2 border-[#f37021] pb-6">
        <div className="flex w-full justify-between items-center mb-6">
          <img src={logoUrl} alt="Service Logic" className="h-16 object-contain" />
          <h1 className="text-sm font-bold uppercase w-2/3 text-right leading-tight text-[#1b4382]">
            LICENÇA DE USO E SERVIÇOS DE IMPLANTAÇÃO, MANUTENÇÃO E SUPORTE DE SOFTWARE.
          </h1>
        </div>
      </div>

      <div className="space-y-4 text-justify">
        <div>
          <h3 className="font-bold uppercase mt-6 mb-2 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3">
            DEFINIÇÕES:
          </h3>
          <p>{CONTRACT_TEXT.DEFINICOES}</p>
        </div>

        <div className="transition-colors duration-500 p-2 -mx-2 rounded-lg">
          <h3 className="font-bold uppercase mt-4 mb-2 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3">
            CONTRATANTE:
          </h3>
          <p>
            <Highlight value={name} fallback="[NOME DA EMPRESA]" />, pessoa jurídica de direito
            privado, inscrita no CNPJ sob o nº <Highlight value={cnpj} fallback="[CNPJ]" />, com
            sede na <Highlight value={address} fallback="[ENDEREÇO DA SEDE]" />, neste ato
            representado pelos seus representantes legais Sr{' '}
            <Highlight value={repName} fallback="[NOME DO REPRESENTANTE]" />, inscrito no CPF sob o
            nº <Highlight value={repCpf} fallback="[CPF]" /> e RG sob o nº{' '}
            <Highlight value={repRg} fallback="[RG]" />.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase mt-6 mb-2 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3">
            CONTRATADA:
          </h3>
          <p>{CONTRACT_TEXT.CONTRATADA}</p>
        </div>

        <p className="mt-4">{CONTRACT_TEXT.INTRO}</p>

        <ClauseBlock
          title="CLÁUSULA PRIMEIRA - DO OBJETO DO CONTRATO"
          texts={CONTRACT_TEXT.CLAUSULA_1}
        />
        {selectedModules.filter((id: string) => !MODULES.find((m) => m.id === id)?.isBasic).length >
          0 && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-bold text-sm text-[#1b4382] mb-2">
              Módulos Adicionais Contratados:
            </h4>
            <ul className="list-disc list-inside text-[11px] space-y-1">
              {selectedModules
                .filter((id: string) => !MODULES.find((m) => m.id === id)?.isBasic)
                .map((id: string) => {
                  const mod = MODULES.find((m) => m.id === id)
                  const price =
                    typeof customModulePrices[id] === 'number' ? customModulePrices[id] : mod?.price
                  return (
                    <li key={id}>
                      <strong>{mod?.name}</strong>
                      {mod?.franquia_quantidade
                        ? ` (Franquia: ${mod.franquia_quantidade} placas)`
                        : ''}{' '}
                      — {mod?.price === 0 ? 'Incluso' : formatCurrency(price || 0)}
                      {moduleGracePeriods[id] > 0
                        ? ` (Isento por ${moduleGracePeriods[id]} meses)`
                        : ''}
                    </li>
                  )
                })}
            </ul>
          </div>
        )}
        <ClauseBlock
          title="CLÁUSULA SEGUNDA - MELHORIAS, CUSTOMIZAÇÕES E SERVIÇOS NÃO CONTEMPLADOS NO CONTRATO."
          texts={CONTRACT_TEXT.CLAUSULA_2}
        />
        <ClauseBlock
          title="CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA CONTRATANTE"
          texts={CONTRACT_TEXT.CLAUSULA_3}
        />
        <ClauseBlock
          title="CLÁUSULA QUARTA - OBRIGAÇÕES DA CONTRATADA"
          texts={CONTRACT_TEXT.CLAUSULA_4}
        />

        <div className="mb-6 transition-colors duration-500 p-2 -mx-2 rounded-lg">
          <h3 className="font-bold uppercase mt-4 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3">
            CLÁUSULA QUINTA - PREÇO, FORMA DE PAGAMENTO E SUSPENSÃO DOS SERVIÇOS.
          </h3>
          <p className="mb-3">
            5.1) A CONTRATANTE pagará uma mensalidade pelo direito de uso do software, de acordo com
            o número de emissões de documentos eletrônicos por mês contratados conforme assinalado
            com "X" na tabela abaixo:
          </p>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1b4382] text-white">
                  <th className="border border-slate-300 p-1.5 text-left">PLANOS*</th>
                  <th className="border border-slate-300 p-1.5 text-right">Valor (R$)</th>
                  <th className="border border-slate-300 p-1.5 text-center">Ciclo</th>
                  <th className="border border-slate-300 p-1.5 text-center">Excedente</th>
                  <th className="border border-slate-300 p-1.5 text-center">Contratado</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((p) => (
                  <tr key={p.id} className={selectedPlan === p.id ? 'bg-[#1b4382]/10' : ''}>
                    <td className="border border-slate-300 p-1.5">
                      {p.name} ({p.limit})
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right">
                      {selectedPlan === p.id
                        ? planBilling === 'anual'
                          ? formatCurrency(planAnnualPrice)
                          : formatCurrency(planPrice)
                        : 'R$ xx,00'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      {selectedPlan === p.id
                        ? planBilling === 'anual'
                          ? 'Anual'
                          : 'Mensal'
                        : 'Mensal'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">R$ 0,99</td>
                    <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold">
                      {selectedPlan === p.id ? 'X' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] mt-1 text-slate-600">
              (*) Módulos inclusos nos Planos: {getPlanIncludedModuleNames(selectedPlan)}. <br />
              (**) Ct-e, MDF-e, NF-e, NFS-e e Documentos cancelados.
            </p>
            {selectedPlan !== 'none' && planData && (
              <p className="text-[10px] mt-1 font-medium text-[#1b4382]">
                Plano selecionado: <strong>{planData.name}</strong> — {planData.limit} documentos
                eletrônicos por mês, no valor de {formatCurrency(planPrice)} mensais.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p>
              5.2) Para cada documento eletrônico emitido além da franquia contratada acima, será
              cobrado um valor unitário que varia de acordo com o plano entre R$ 0,99.
            </p>
            <p>
              5.3) Caso o cliente possua o módulo controle de viagens, será cobrado um valor
              unitário de acordo com o combinado entre as partes de R$ 0,99 para cada viagem
              excedida ao plano contratado da franquia de 500 viagens emitido.
            </p>
            <p className="pl-4">
              ● Os planos SL_TMS dão direito ao cadastro de apenas um CNPJ Matriz. Para a inclusão
              de filiais (CNPJ's de mesma raiz) será cobrado uma taxa de R$ 199,00 cada adicional.
              {filiais && filiais.length > 0 && filiais.every((f: any) => f.isentar) && (
                <span className="font-bold">
                  {' '}
                  Fica isenta a taxa de inclusão para as filiais descritas abaixo.
                </span>
              )}
              {filiais &&
                filiais.length > 0 &&
                filiais.some((f: any) => !f.isentar) &&
                filiais.some((f: any) => f.isentar) && (
                  <span className="font-bold">
                    {' '}
                    Fica isenta a taxa de inclusão apenas para as filiais devidamente marcadas com
                    Isenção.
                  </span>
                )}
              <br />
              Será incluída neste contrato como parte integrante, a empresa coligada ou filial
              descritas:
            </p>
          </div>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1b4382] text-white">
                  <th colSpan={3} className="border border-slate-300 p-1.5 text-center font-bold">
                    Empresas
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-1.5 font-bold w-1/4">Matriz</td>
                  <td className="border border-slate-300 p-1.5">
                    <Highlight value={name} fallback="[NOME DA EMPRESA]" />
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <Highlight value={cnpj} fallback="[CNPJ]" />
                  </td>
                </tr>
                {filiais && filiais.length > 0 ? (
                  filiais.map((filial: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-slate-300 p-1.5 font-bold w-1/4">
                        Filial {index + 1}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-slate-600">
                        {filial.nome ? filial.nome : 'Inclusão de Filial'}
                        {filial.isentar && (
                          <span className="text-xs italic text-slate-400 ml-1">(Isenta)</span>
                        )}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <Highlight value={filial.cnpj} fallback="[CNPJ]" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-slate-300 p-1.5 font-bold w-1/4">Filial</td>
                    <td className="border border-slate-300 p-1.5 text-slate-400 italic">
                      Preencher caso haja...
                    </td>
                    <td className="border border-slate-300 p-1.5"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 mt-4 p-2 -mx-2 rounded-lg transition-colors duration-500">
            <p>5.4) A CONTRATANTE poderá cadastrar no sistema Usuários ilimitados.</p>
            <p>
              5.5) Para Adesão ao plano SL-TMS WEB, será cobrado uma taxa única no valor de R$
              165,00 (cento e sessenta e cinco reais) que deverá ser pago em 5 dias corridos após
              assinatura do contrato.
            </p>
            <p>
              5.6) A CONTRATANTE pagará um valor por cada módulo adicional que for incluído ao seu
              plano.
            </p>
            <p>
              5.7) Para a Implantação / Treinamento será cobrado o valor referente aos módulos
              contratados conforme assinalado com "X" na tabela abaixo:
            </p>
          </div>

          <div className="overflow-x-auto my-4 p-2 -mx-2 rounded-lg transition-colors duration-500">
            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1b4382] text-white">
                  <th className="border border-slate-300 p-1.5 text-left">Módulo</th>
                  <th className="border border-slate-300 p-1.5 text-center w-12">Horas</th>
                  <th className="border border-slate-300 p-1.5 text-right w-20">Valor</th>
                  <th className="border border-slate-300 p-1.5 text-center w-16">Ciclo</th>
                  <th className="border border-slate-300 p-1.5 text-center w-20">Contratado</th>
                  <th className="border border-slate-300 p-1.5 text-right w-24">
                    Implantação ({implMode === 'remoto' ? 'Remoto' : 'Presencial'})
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedPlan !== 'none' && (
                  <tr>
                    <td className="border border-slate-300 p-1.5">
                      Básicos
                      {selectedPlan === 'tms-30' && (
                        <span className="text-[9px] block text-slate-500">
                          ({getPlanIncludedModuleNames(selectedPlan)})
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      {BASE_IMPLEMENTATION_HOURS}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right">Incluso</td>
                    <td className="border border-slate-300 p-1.5 text-center">-</td>
                    <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold">
                      X
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right">
                      {formatCurrency(BASE_IMPLEMENTATION_HOURS * implRate)}
                    </td>
                  </tr>
                )}
                {MODULES.map((m) => {
                  if (getPlanDefaultModules(selectedPlan).includes(m.id)) return null

                  const cicle = moduleBilling[m.id] || 'mensal'
                  const modPrice =
                    cicle === 'anual'
                      ? (customModuleAnnualPrices[m.id] ?? m.price * 12)
                      : (customModulePrices[m.id] ?? m.price)

                  return (
                    <tr
                      key={m.id}
                      className={selectedModules.includes(m.id) ? 'bg-[#1b4382]/10' : ''}
                    >
                      <td className="border border-slate-300 p-1.5">
                        {m.name}
                        {selectedModules.includes(m.id) && moduleGracePeriods[m.id] > 0 && (
                          <span className="text-[9px] block text-emerald-600">
                            Isento por {moduleGracePeriods[m.id]} meses
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">{m.implHours}</td>
                      <td className="border border-slate-300 p-1.5 text-right">
                        {m.price === 0 ? 'Incluso' : formatCurrency(modPrice)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {selectedModules.includes(m.id)
                          ? cicle === 'anual'
                            ? 'Anual'
                            : 'Mensal'
                          : '-'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold">
                        {selectedModules.includes(m.id) ? 'X' : ''}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right">
                        {selectedModules.includes(m.id)
                          ? (m as any).fixedImplPrice !== undefined
                            ? typeof (m as any).fixedImplPrice === 'object'
                              ? formatCurrency((m as any).fixedImplPrice[implMode])
                              : formatCurrency((m as any).fixedImplPrice)
                            : formatCurrency(m.implHours * implRate)
                          : '-'}
                      </td>
                    </tr>
                  )
                })}
                {includeDiagnosticVisit && diagnosticVisits.length > 0
                  ? diagnosticVisits.map((v: any, index: number) => (
                      <tr key={`diag-${index}`} className="bg-[#1b4382]/10">
                        <td className="border border-slate-300 p-1.5" colSpan={2}>
                          Visita Presencial de Diagnóstico
                          {v.date
                            ? ` - Data: ${new Date(v.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                            : ''}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right" colSpan={2}>
                          -
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold">
                          X
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right">
                          {formatCurrency(Number(v.value) || 0)}
                        </td>
                      </tr>
                    ))
                  : includeDiagnosticVisit && (
                      <tr className="bg-[#1b4382]/10">
                        <td className="border border-slate-300 p-1.5" colSpan={2}>
                          Visita Presencial de Diagnóstico
                          {diagnosticVisitDate
                            ? ` - Data: ${new Date(diagnosticVisitDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                            : ''}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right" colSpan={2}>
                          -
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold">
                          X
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right">
                          {formatCurrency(Number(diagnosticVisitValue) || 0)}
                        </td>
                      </tr>
                    )}
                {trainings &&
                  trainings.map((t: any) => (
                    <tr key={t.id} className="bg-[#1b4382]/10">
                      <td className="border border-slate-300 p-1.5" colSpan={2}>
                        Treinamento: {t.name}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right" colSpan={2}>
                        -
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold">
                        X
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-medium">
                        {t.isFree ? (
                          <span className="text-emerald-700">Grátis</span>
                        ) : (
                          formatCurrency(Number(t.price) || 0)
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#1b4382] text-white font-bold">
                  <td className="border border-slate-300 p-1.5 text-right">Total</td>
                  <td className="border border-slate-300 p-1.5 text-center">
                    {(selectedPlan !== 'none' ? BASE_IMPLEMENTATION_HOURS : 0) + totalImplHours}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right" colSpan={3}></td>
                  <td className="border border-slate-300 p-1.5 text-right">
                    {formatCurrency(implValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="space-y-3 mt-4">
            <p>
              5.8) Caso a CONTRATANTE opte por contratar o módulo FROTA, já estará incluso nesta
              contratação a franquia de 10 (dez) placas. Placas adicionais serão cobradas um valor
              unitário
              {additionalPlates > 0
                ? ` de ${formatCurrency(additionalPlatesPrice || 0)} para a quantidade atual de ${additionalPlates} placa(s)`
                : ''}
              .
            </p>
            <p>
              5.9) O valor da Licença de Uso será composto pelo somatório dos valores do plano
              contratado, o valor dos módulos contratados a parte, o total de placas adicionais e
              documentos excedentes.
            </p>
            <p>
              5.10) Para apuração da quantidade dos Documentos Eletrônicos emitidos, placas de
              veículos no sistema e n° de filiais, será utilizado uma data de corte compreendendo o
              dia 01 do mês corrente até o último dia do mês corrente.
            </p>
            <p>
              5.11) Os pagamentos serão realizados mediante quitação de boleto bancário enviado
              antecipadamente para o endereço de e-mail fornecido pela CONTRATANTE.
            </p>
            <p>
              5.12) A CONTRATANTE deverá informar antes da data de vencimento, a alteração do
              endereço de e-mail, como também, comunicar o não recebimento do boleto bancário, e
              solicitar segunda via para pagamento, antes da data do vencimento.
            </p>
            <p>
              5.13) O presente contrato será reajustado de forma a preservar o equilíbrio econômico
              financeiro de suas condições, sempre por meio de duas formas: o Reajuste de Preços ou
              a Recomposição de Preços.
            </p>
            <p>
              5.14) O Reajuste de Preço é um procedimento automático, aplicado ao valor mensal pago
              a CONTRATADA, em decorrência da variação do IPCA (Índice Nacional de Preços ao
              Consumidor Amplo) calculado pelo Instituto Brasileiro de Geografia e Estatística
              (IBGE) referente aos 12 (doze) meses praticados no contrato.
            </p>
            <p>
              5.15) A Recomposição de Preços é o procedimento destinado a avaliar a ocorrência de
              eventos que afetam a equação econômico financeira do presente contrato e promove
              adequação das cláusulas contratuais aos parâmetros necessários para recompor o
              equilíbrio original.
            </p>
            <p>
              5.16) Fica convencionado, que em caso de inadimplência do pagamento, ao valor do
              principal, incidirão multa de 2% (dois por cento), e juros de mora de 1% (um por
              cento) ao mês, a teor do art. 406 do Código Civil, e art. 52, parágrafo 2º do Código
              de Defesa do Consumidor.
            </p>
            <p>
              5.17) A mensalidade da CONTRATANTE não sofrerá interrupções, adiamentos ou suspensão,
              durante o prazo de vigência do presente contrato, independentemente do uso ou não do
              software devidamente implantado e em operação.
            </p>
            <p>
              5.18) Em caso de inadimplência por parte do CONTRATANTE, por prazo superior à 10 dias
              (Dez dias), contado da data do vencimento da obrigação, os serviços serão
              imediatamente suspensos, sendo facultado a CONTRATADA efetuar a rescisão contratual,
              prosseguindo em qualquer hipótese com a cobrança dos débitos em atraso, não se
              responsabilizando a mesma, por qualquer outro dano que porventura venha a ocorrer em
              virtude de tal suspensão e/ou rescisão, seja em relação ao CONTRATANTE, seja em
              relação a clientes finais.
            </p>
            <p>
              5.19) A CONTRATADA se reserva ao direito, em caso de inadimplência dos pagamentos
              vencidos com datas superiores a 30 dias (trinta dias), por parte do CONTRATANTE, a
              inserir seu nome nos Serviços de Proteção ao Crédito (SPC).
            </p>
            <p>
              5.20) A CONTRATANTE poderá solicitar o cancelamento do contrato a qualquer momento,
              desde que esteja adimplente com suas obrigações financeiras.
            </p>
            <p>
              5.21) No caso da CONTRATANTE solicitar o cancelamento do contrato, a CONTRATADA
              disponibilizará o sistema apenas para fins de consulta pelo período solicitado pela
              CONTRATANTE. Pela responsabilidade jurídica sobre os dados armazenados, bem como o
              custo de armazenamento dos dados em nosso Data Center, será cobrada uma taxa mensal
              correspondente à 50% do valor referente à última mensalidade pelo período em que o
              sistema ficar disponível para consulta.
            </p>
            {parcelasImplantacao > 1 ? (
              <p>
                5.21.1) O valor da implantação de {formatCurrency(implValue)} será pago em{' '}
                {parcelasImplantacao} parcelas de {formatCurrency(implValue / parcelasImplantacao)},
                mediante boleto bancário.
              </p>
            ) : (
              <p>
                5.21.1) O valor da implantação de {formatCurrency(implValue)} será pago à vista,
                mediante boleto bancário.
              </p>
            )}
            <p>5.22) Valor Resumo:</p>
          </div>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs border-collapse border border-slate-300">
              <tbody>
                {planPrice > 0 && planBilling === 'mensal' && (
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold w-1/3">
                      Plano Mensal ({planData?.name})
                    </td>
                    <td className="border border-slate-300 p-2 text-right">
                      {formatCurrency(planPrice)}
                    </td>
                    <td className="border border-slate-300 p-2" rowSpan={3}>
                      <strong>Observações:</strong>
                      <br />
                      Forma de pagamento: Boleto
                      <br />
                      Implantação:{' '}
                      {parcelasImplantacao > 1
                        ? `${parcelasImplantacao}x de ${formatCurrency(implValue / parcelasImplantacao)}`
                        : 'À vista'}
                    </td>
                  </tr>
                )}
                {modulesPrice > 0 && (
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      Módulos Mensais (
                      {
                        selectedModules.filter(
                          (id: string) =>
                            !MODULES.find((m) => m.id === id)?.isBasic &&
                            moduleBilling[id] !== 'anual',
                        ).length
                      }
                      )
                    </td>
                    <td className="border border-slate-300 p-2 text-right">
                      {formatCurrency(modulesPrice)}
                    </td>
                  </tr>
                )}
                {selectedDfe && selectedDfe !== 'dfe-none' && dfeBilling === 'mensal' && (
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      {dfeData?.name || 'Franquia DF-e'} (Mensal)
                      {cobrarDfePorFilial ? ` - Por Filial (${quantidadeFiliaisDfe}x)` : ''}
                    </td>
                    <td className="border border-slate-300 p-2 text-right">
                      {formatCurrency(dfePrice || 0)}
                    </td>
                  </tr>
                )}
                {!!additionalPlates && additionalPlates > 0 && platesBilling === 'mensal' && (
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      Placas Adicionais ({additionalPlates}) (Mensal)
                    </td>
                    <td className="border border-slate-300 p-2 text-right">
                      {formatCurrency(additionalPlatesTotal || 0)}
                    </td>
                  </tr>
                )}
                {!!additionalBranches && additionalBranches > 0 && branchesBilling === 'mensal' && (
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      Filiais Adicionais ({additionalBranches}) (Mensal)
                    </td>
                    <td className="border border-slate-300 p-2 text-right">
                      {formatCurrency(additionalBranchesTotal || 0)}
                    </td>
                  </tr>
                )}

                {calculatedDiscount > 0 && (
                  <>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 p-2 font-bold text-right text-xs">
                        Subtotal Mensal (Valor Padrão)
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-bold">
                        {formatCurrency(totalValueStandard)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-700 text-right">
                        Desconto Aplicado Mensalidade{' '}
                        {tipoDesconto === 'percentual' ? `(${descontoMensalidade}%)` : ''}
                        {isencaoPeriodo > 0 ? ` - Período de Isenção: ${isencaoPeriodo} meses` : ''}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-700 font-medium">
                        - {formatCurrency(calculatedDiscount)}
                      </td>
                    </tr>
                  </>
                )}
                {totalValue !== Math.max(0, totalValueStandard - calculatedDiscount) && (
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold text-orange-600 text-right">
                      Ajuste Comercial Mensal
                    </td>
                    <td className="border border-slate-300 p-2 text-right text-orange-600 font-medium">
                      {formatCurrency(
                        totalValue - Math.max(0, totalValueStandard - calculatedDiscount),
                      )}
                    </td>
                  </tr>
                )}
                <tr className="bg-[#1b4382]/5 text-[#1b4382]">
                  <td className="border border-slate-300 p-2 font-bold text-right">
                    Total Mensal Inicial
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-bold">
                    {formatCurrency(Math.max(0, totalValue))}
                  </td>
                </tr>

                {totalAnual > 0 && (
                  <>
                    <tr className="bg-slate-50">
                      <td colSpan={2} className="border border-slate-300 p-2 font-bold text-center">
                        Itens com Cobrança Anual
                      </td>
                    </tr>
                    {planAnnualPrice > 0 && planBilling === 'anual' && (
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">
                          Plano Anual ({planData?.name})
                        </td>
                        <td className="border border-slate-300 p-2 text-right">
                          {formatCurrency(planAnnualPrice)}
                        </td>
                      </tr>
                    )}
                    {selectedModules.some((id: string) => moduleBilling[id] === 'anual') && (
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">
                          Módulos Anuais (
                          {
                            selectedModules.filter((id: string) => moduleBilling[id] === 'anual')
                              .length
                          }
                          )
                        </td>
                        <td className="border border-slate-300 p-2 text-right">
                          {formatCurrency(
                            selectedModules.reduce(
                              (acc: number, id: string) =>
                                acc +
                                (moduleBilling[id] === 'anual'
                                  ? customModuleAnnualPrices[id] || 0
                                  : 0),
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    )}
                    {selectedDfe && selectedDfe !== 'dfe-none' && dfeBilling === 'anual' && (
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">
                          {dfeData?.name || 'Franquia DF-e'} (Anual)
                        </td>
                        <td className="border border-slate-300 p-2 text-right">
                          {formatCurrency(dfeAnnualPrice || 0)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#1b4382]/5 text-[#1b4382]">
                      <td className="border border-slate-300 p-2 font-bold text-right">
                        Total Anual Inicial
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-bold">
                        {formatCurrency(Math.max(0, totalAnual))}
                      </td>
                    </tr>
                  </>
                )}

                <tr className="bg-[#1b4382]/5 text-[#1b4382]">
                  <td className="border border-slate-300 p-2 font-bold text-right">
                    Total Visitas / Implantação
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-bold" colSpan={2}>
                    {formatCurrency(implValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {prazosConcedidos && (
            <div className="mt-6 transition-colors duration-500 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-bold uppercase mb-2 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3">
                CONDIÇÕES ESPECIAIS / PRAZOS CONCEDIDOS
              </h3>
              <p className="text-justify">{prazosConcedidos}</p>
            </div>
          )}
        </div>

        <ClauseBlock
          title="CLÁUSULA SEXTA - SERVIÇO DE IMPLANTAÇÃO/TREINAMENTO"
          texts={CONTRACT_TEXT.CLAUSULA_6}
        />
        <ClauseBlock title="CLÁUSULA SÉTIMA – DA DIVULGAÇÃO" texts={CONTRACT_TEXT.CLAUSULA_7} />
        <ClauseBlock
          title="CLÁUSULA OITAVA - DA GARANTIA E RESPONSABILIDADES"
          texts={CONTRACT_TEXT.CLAUSULA_8}
        />
        <ClauseBlock
          title="CLÁUSULA NONA – LEI GERAL DE PROTEÇÃO DE DADOS ( LGPD )"
          texts={CONTRACT_TEXT.CLAUSULA_9}
        />
        <ClauseBlock title="CLÁUSULA DÉCIMA - DO FORO" texts={CONTRACT_TEXT.CLAUSULA_10} />

        <div className="mt-16 print:mt-12 break-inside-avoid">
          <p className="text-center mb-10 print:mb-12">
            E por estarem justos e contratados, assinam eletronicamente.
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-10 sm:gap-16 print:flex-row print:gap-16 print:items-end">
            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="h-12 sm:h-16 print:h-16 flex items-end" />
              <div className="w-full border-t-2 border-[#1b4382] pt-3">
                <p className="font-bold text-[#1b4382] text-sm leading-snug break-words">
                  CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA
                </p>
                <p className="text-[11px] text-slate-500 mt-1">CNPJ: 27.751.577/0001-91</p>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Rodrigo Goronci Sant'Ana
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                  Contratada
                </p>
              </div>
            </div>
            <div className="hidden sm:block sm:w-8 print:block print:w-8" />
            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="h-12 sm:h-16 print:h-16 flex items-end" />
              <div className="w-full border-t-2 border-[#1b4382] pt-3">
                <p className="font-bold uppercase text-[#1b4382] text-sm leading-snug break-words">
                  <Highlight value={name} fallback="[NOME DA EMPRESA]" />
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  CNPJ: <Highlight value={cnpj} fallback="[CNPJ]" />
                </p>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  <Highlight value={repName} fallback="[NOME DO REPRESENTANTE]" />
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                  Contratante
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
