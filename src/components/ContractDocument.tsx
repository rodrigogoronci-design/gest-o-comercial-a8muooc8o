import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { PLANS, MODULES, DFE_TIERS, BASE_IMPLEMENTATION_HOURS } from '@/constants/contracts'
import { CONTRACT_TEXT } from '@/constants/contract-text'
import logoUrl from '@/assets/logomarca-service-f9dbd.png'

export const Highlight = ({ value, fallback }: { value: string; fallback: string }) => (
  <strong
    className={cn(
      'mx-1 px-1 rounded transition-colors',
      value
        ? 'bg-transparent font-bold text-[#1b4382] print:text-black'
        : 'bg-[#f37021]/20 font-medium text-[#f37021] print:text-black print:bg-transparent',
    )}
  >
    {value || fallback}
  </strong>
)

const ClauseBlock = ({ title, texts }: { title: string; texts: string[] }) => (
  <div className="mb-6">
    <h3 className="font-bold uppercase mt-6 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
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
  dfeData,
  dfePrice,
  totalValue,
  implMode,
  implRate,
  totalImplHours,
  implValue,
}: any) {
  return (
    <div className="p-8 sm:p-12 text-[12px] text-slate-800 font-serif leading-relaxed space-y-5 print:p-0 print:text-black">
      <div className="flex flex-col items-center mb-8 border-b-2 border-[#f37021] print:border-black pb-6">
        <div className="flex w-full justify-between items-center mb-6">
          <img src={logoUrl} alt="Service Logic" className="h-16 object-contain" />
          <h1 className="text-sm font-bold uppercase w-2/3 text-right leading-tight text-[#1b4382] print:text-black">
            LICENÇA DE USO E SERVIÇOS DE IMPLANTAÇÃO, MANUTENÇÃO E SUPORTE DE SOFTWARE.
          </h1>
        </div>
      </div>

      <div className="space-y-4 text-justify">
        <div>
          <h3 className="font-bold uppercase mt-6 mb-2 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
            DEFINIÇÕES:
          </h3>
          <p>{CONTRACT_TEXT.DEFINICOES}</p>
        </div>

        <div
          id="section-contratante"
          className="scroll-mt-6 transition-colors duration-500 p-2 -mx-2 rounded-lg"
        >
          <h3 className="font-bold uppercase mt-4 mb-2 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
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
          <h3 className="font-bold uppercase mt-6 mb-2 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
            CONTRATADA:
          </h3>
          <p>{CONTRACT_TEXT.CONTRATADA}</p>
        </div>

        <p className="mt-4">{CONTRACT_TEXT.INTRO}</p>

        <ClauseBlock
          title="CLÁUSULA PRIMEIRA - DO OBJETO DO CONTRATO"
          texts={CONTRACT_TEXT.CLAUSULA_1}
        />
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

        <div
          id="section-planos"
          className="mb-6 scroll-mt-6 transition-colors duration-500 p-2 -mx-2 rounded-lg"
        >
          <h3 className="font-bold uppercase mt-4 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
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
                <tr className="bg-[#1b4382] text-white print:bg-slate-200 print:text-black">
                  <th className="border border-slate-300 p-1.5 text-left">PLANOS*</th>
                  <th className="border border-slate-300 p-1.5 text-right">Mensalidade (R$)</th>
                  <th className="border border-slate-300 p-1.5 text-center">Excedente</th>
                  <th className="border border-slate-300 p-1.5 text-center">Contratado</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((p) => (
                  <tr
                    key={p.id}
                    className={
                      selectedPlan === p.id
                        ? 'bg-[#1b4382]/10 print:bg-transparent print:font-bold'
                        : ''
                    }
                  >
                    <td className="border border-slate-300 p-1.5">
                      {p.name} ({p.limit})
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">R$ 0,99</td>
                    <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold print:text-black">
                      {selectedPlan === p.id ? 'X' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] mt-1 text-slate-600">
              (*) Módulos inclusos nos Planos: Administração, Básico, Carga, Comercial, Faturamento,
              Financeiro. <br />
              (**) Ct-e, MDF-e, NF-e, NFS-e e Documentos cancelados.
            </p>
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
              de filiais (CNPJ’s de mesma raiz) será cobrado uma taxa de R$ 199,00 cada adicional.
              Será incluída neste contrato como parte integrante, a empresa coligada ou filial
              descritas:
            </p>
          </div>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1b4382] text-white print:bg-slate-200 print:text-black">
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
                <tr>
                  <td className="border border-slate-300 p-1.5 font-bold">Filial</td>
                  <td className="border border-slate-300 p-1.5 text-slate-400 italic">
                    Preencher caso haja...
                  </td>
                  <td className="border border-slate-300 p-1.5"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            id="section-modulos"
            className="space-y-3 mt-4 scroll-mt-6 p-2 -mx-2 rounded-lg transition-colors duration-500"
          >
            <p>5.4) A CONTRATANTE poderá cadastrar no sistema Usuários ilimitados.</p>
            <p>
              5.5) Para Adesão ao plano SL-TMS WEB, será cobrado uma taxa única no valor de R$ 99,00
              (noventa e nove reais) que deverá ser pago em 5 dias corridos após assinatura do
              contrato.
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

          <div
            id="section-implantacao"
            className="overflow-x-auto my-4 scroll-mt-6 p-2 -mx-2 rounded-lg transition-colors duration-500"
          >
            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1b4382] text-white print:bg-slate-200 print:text-black">
                  <th className="border border-slate-300 p-1.5 text-left">Módulo</th>
                  <th className="border border-slate-300 p-1.5 text-right w-24">
                    Valor / Mês (R$)
                  </th>
                  <th className="border border-slate-300 p-1.5 text-center w-24">Contratado</th>
                  <th className="border border-slate-300 p-1.5 text-center w-32">
                    Implantação ({implMode === 'remoto' ? 'Remota' : 'Presencial'})
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-1.5">Configuração Base</td>
                  <td className="border border-slate-300 p-1.5 text-right">Incluso</td>
                  <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold print:text-black">
                    X
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center">
                    {formatCurrency(BASE_IMPLEMENTATION_HOURS * implRate)}
                  </td>
                </tr>
                {MODULES.map((m) => (
                  <tr
                    key={m.id}
                    className={
                      selectedModules.includes(m.id)
                        ? 'bg-[#1b4382]/10 print:bg-transparent print:font-bold'
                        : ''
                    }
                  >
                    <td className="border border-slate-300 p-1.5">{m.name}</td>
                    <td className="border border-slate-300 p-1.5 text-right">
                      {m.price === 0 ? 'Incluso' : formatCurrency(m.price)}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-[#f37021] font-bold print:text-black">
                      {selectedModules.includes(m.id) ? 'X' : ''}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      {selectedModules.includes(m.id)
                        ? formatCurrency(m.implHours * implRate)
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 mt-4">
            <p>
              5.8) Caso a CONTRATANTE opte por contratar o módulo FROTA, já estará incluso nesta
              contratação a franquia de 10 (dez) placas. Placas adicionais serão cobradas um valor
              unitário.
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
              5.11) a 5.21) Demais condições de faturamento, reajuste pelo IPCA e cancelamento com
              aviso prévio.
            </p>
            <p>5.22) Valor Resumo:</p>
          </div>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold w-1/3">
                    Plano ({planData?.name})
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    {formatCurrency(planPrice)}
                  </td>
                  <td className="border border-slate-300 p-2" rowSpan={4}>
                    <strong>Observações:</strong>
                    <br />
                    Forma de pagamento: Boleto
                    <br />
                    Implantação: À vista
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold">
                    Módulos ({selectedModules.length})
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    {formatCurrency(modulesPrice)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold">
                    D.F.E. ({dfeData?.name})
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    {formatCurrency(dfePrice)}
                  </td>
                </tr>
                <tr className="bg-[#1b4382]/5 print:bg-slate-200 text-[#1b4382] print:text-black">
                  <td className="border border-slate-300 p-2 font-bold text-right">Total Mensal</td>
                  <td className="border border-slate-300 p-2 text-right font-bold">
                    {formatCurrency(totalValue)}
                  </td>
                </tr>
                <tr className="bg-[#1b4382]/5 print:bg-slate-200 text-[#1b4382] print:text-black">
                  <td className="border border-slate-300 p-2 font-bold text-right">
                    Total Implantação
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-bold" colSpan={2}>
                    {formatCurrency(implValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

        <div className="mt-16 text-center space-y-12">
          <p>E por estarem justos e contratados, assinam eletronicamente.</p>
          <div className="grid grid-cols-2 gap-8 mt-12">
            <div className="border-t border-[#1b4382] pt-2 text-center print:border-black">
              <p className="font-bold text-[#1b4382] print:text-black">
                CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA
              </p>
              <p className="text-[11px] text-slate-500">CONTRATADA</p>
            </div>
            <div className="border-t border-[#1b4382] pt-2 text-center print:border-black">
              <p className="font-bold uppercase text-[#1b4382] print:text-black">
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
