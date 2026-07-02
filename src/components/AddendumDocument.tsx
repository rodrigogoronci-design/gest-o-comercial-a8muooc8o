import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import logoUrl from '@/assets/logomarca-service-ea011.png'

export function AddendumDocument({
  clientName,
  cnpj,
  dataSolicitacao,
  modules,
  valorAdicional,
  valorAnualAdicional,
  valorTotalAtual,
  tipo,
  observacoes,
  prazosConcedidos,
}: any) {
  let formattedModules: Array<{
    name: string
    price: number
    billingCycle?: string
    isTaxaUnica?: boolean
    isFree?: boolean
  }> = []

  if (Array.isArray(modules)) {
    formattedModules = modules.map((m: any) => {
      if (typeof m === 'string') return { name: m, price: 0 }
      return {
        name: m.name || m.descricao || m.modulo || m.titulo || 'Item Adicional',
        price: Number(
          m.billingCycle === 'anual'
            ? m.annualPrice
            : m.price || m.valor || m.valor_mensalidade || 0,
        ),
        billingCycle: m.billingCycle || 'mensal',
        isTaxaUnica:
          m.name?.toLowerCase().includes('treinamento') ||
          m.tipo === 'taxa_unica' ||
          m.isFree !== undefined,
        isFree: m.isFree,
      }
    })
  } else if (modules && typeof modules === 'object') {
    if (Array.isArray(modules.adicionais)) {
      formattedModules = modules.adicionais.map((m: any) => ({
        name: m.name || m.descricao || 'Item Adicional',
        price: Number(m.billingCycle === 'anual' ? m.annualPrice : m.price || m.valor || 0),
        billingCycle: m.billingCycle || 'mensal',
        isTaxaUnica:
          m.name?.toLowerCase().includes('treinamento') ||
          m.tipo === 'taxa_unica' ||
          m.isFree !== undefined,
        isFree: m.isFree,
      }))
    }
    if (modules.filiais && typeof modules.filiais === 'number' && modules.filiais > 0) {
      formattedModules.push({
        name: `Inclusão de Filiais Adicionais (${modules.filiais} unidade${modules.filiais > 1 ? 's' : ''})`,
        price: modules.filiais * 199,
        billingCycle: 'mensal',
      })
    }
    if (Array.isArray(modules.filiais_detalhes)) {
      modules.filiais_detalhes.forEach((f: any) => {
        const branchName = f.nome || '[Nome da Filial]'
        const branchCnpj = f.cnpj || '[CNPJ]'
        formattedModules.push({
          name: `Referente à inclusão da filial ${branchName} - CNPJ: ${branchCnpj}${f.isentar ? ' (Isenta)' : ''}`,
          price: f.isentar ? 0 : Number(f.price || f.valor || 199),
          billingCycle: 'mensal',
        })
        if (f.dfe || f.dfe_ativo) {
          formattedModules.push({
            name: `Ativação de DF-e (Filial${branchName}: ${f.cnpj || 'Nova Unidade'})`,
            price: Number(f.dfe_price || f.dfe_valor || 0),
            billingCycle: 'mensal',
          })
        }
      })
    }
  }

  // Fallback para observações do histórico se os módulos estiverem vazios
  if (formattedModules.length === 0 && (observacoes || tipo)) {
    if (
      tipo === 'Aditivo de Filial' ||
      (observacoes && observacoes.includes('Adição de Filial:'))
    ) {
      const cnpjMatch = observacoes?.match(/CNPJ:\s*([\d.\-/]+)/)
      const dfeMatch = observacoes?.match(/DF-e:\s*Sim/)

      const extractedCnpj = cnpjMatch ? cnpjMatch[1] : '[CNPJ]'
      const total = Number(valorAdicional || 0)
      const basePrice = dfeMatch && total > 49.9 ? total - 49.9 : total

      formattedModules.push({
        name: `Referente à inclusão da filial - CNPJ: ${extractedCnpj}`,
        price: basePrice > 0 ? basePrice : 199,
        billingCycle: 'mensal',
      })

      if (dfeMatch) {
        formattedModules.push({
          name: `inclusão do DF-e para a filial - CNPJ ${extractedCnpj}`,
          price: 49.9,
          billingCycle: 'mensal',
        })
      }
    } else {
      formattedModules.push({
        name: observacoes || tipo || 'Adição de Serviços Contratuais',
        price: Number(valorAdicional || 0),
        billingCycle: 'mensal',
      })
    }
  }

  return (
    <div className="p-8 sm:p-12 text-[12px] text-slate-800 font-serif leading-relaxed space-y-5 bg-white print:p-0 print:text-black">
      <div className="flex flex-col items-center mb-8 border-b-2 border-[#f37021] print:border-black pb-6">
        <div className="flex w-full justify-between items-center mb-6">
          <img src={logoUrl} alt="Service Logic" className="h-16 object-contain" />
          <h1 className="text-sm font-bold uppercase w-2/3 text-right leading-tight text-[#1b4382] print:text-black">
            ADITIVO CONTRATUAL DE INCLUSÃO DE MÓDULOS
          </h1>
        </div>
      </div>

      <div className="space-y-6 text-justify">
        <p>
          Pelo presente instrumento de aditamento ao contrato original de licença de uso e prestação
          de serviços, as partes abaixo qualificadas:
        </p>

        <div>
          <p className="mb-2">
            <strong>CONTRATADA:</strong> CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA, pessoa jurídica de
            direito privado, inscrita no CNPJ sob o nº 27.751.577/0001-91, com sede na Rua Paulo de
            Vasconcelos, nº 429, Maria Ortiz, Vitoria-ES - CEP 29.070-364.
          </p>
          <p>
            <strong>CONTRATANTE:</strong> <strong>{clientName || '[NOME DO CLIENTE]'}</strong>,
            inscrita no CNPJ sob o nº <strong>{cnpj ? formatCNPJ(cnpj) : '[CNPJ]'}</strong>.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase mt-6 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
            1. DO OBJETO DO ADITIVO
          </h3>
          <p className="mb-4">
            O presente aditivo tem por objeto formalizar a inclusão de novos módulos ao sistema
            TMS-SERVICE LOGIC, solicitados pela CONTRATANTE e efetivados no dia{' '}
            <strong>{dataSolicitacao ? formatDate(dataSolicitacao) : '[DATA]'}</strong>, os quais
            passam a integrar as condições do contrato principal.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase mt-6 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
            2. DOS SERVIÇOS E MÓDULOS ADICIONADOS
          </h3>
          <p className="mb-3">
            A CONTRATANTE adere expressamente aos seguintes itens e serviços adicionais:
          </p>

          <table className="w-full text-xs border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-[#1b4382] text-white print:bg-slate-200 print:text-black">
                <th className="border border-slate-300 p-2 text-left">
                  Descrição do Item / Serviço
                </th>
                <th className="border border-slate-300 p-2 text-center w-24">Ciclo</th>
                <th className="border border-slate-300 p-2 text-right w-40">Valor Adicional</th>
              </tr>
            </thead>
            <tbody>
              {formattedModules.length > 0 ? (
                formattedModules.map((m: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-2 whitespace-pre-line">{m.name}</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {m.isTaxaUnica ? 'Único' : m.billingCycle === 'anual' ? 'Anual' : 'Mensal'}
                    </td>
                    <td className="border border-slate-300 p-2 text-right">
                      {m.isTaxaUnica
                        ? m.isFree
                          ? 'Grátis'
                          : `${formatCurrency(m.price)}`
                        : m.price > 0
                          ? formatCurrency(m.price)
                          : 'Incluso'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="border border-slate-300 p-2 text-center text-slate-500 italic"
                  >
                    Especificação de serviços constará nos autos de histórico do contrato principal.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#1b4382]/10 print:bg-slate-100 font-bold">
                <td colSpan={2} className="border border-slate-300 p-2 text-right">
                  Acréscimo Total na Mensalidade
                </td>
                <td className="border border-slate-300 p-2 text-right text-emerald-700 print:text-black">
                  {formatCurrency(valorAdicional || 0)}
                </td>
              </tr>
              {Number(valorAnualAdicional) > 0 && (
                <tr className="bg-[#1b4382]/10 print:bg-slate-100 font-bold">
                  <td colSpan={2} className="border border-slate-300 p-2 text-right">
                    Acréscimo Total Anual
                  </td>
                  <td className="border border-slate-300 p-2 text-right text-emerald-700 print:text-black">
                    {formatCurrency(valorAnualAdicional)}
                  </td>
                </tr>
              )}
              <tr className="bg-[#1b4382]/20 print:bg-slate-200 font-bold">
                <td colSpan={2} className="border border-slate-300 p-2 text-right">
                  Novo Valor Total do Contrato (Mensal)
                </td>
                <td className="border border-slate-300 p-2 text-right text-[#1b4382] print:text-black">
                  {formatCurrency(valorTotalAtual || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {prazosConcedidos && (
          <div>
            <h3 className="font-bold uppercase mt-6 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
              3. CONDIÇÕES ESPECIAIS / PRAZOS CONCEDIDOS
            </h3>
            <p className="mb-4">{prazosConcedidos}</p>
          </div>
        )}

        <div>
          <h3 className="font-bold uppercase mt-6 mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
            {prazosConcedidos ? '4' : '3'}. DISPOSIÇÕES GERAIS
          </h3>
          <p className="mb-4">
            Permanecem inalteradas e em pleno vigor as demais cláusulas e condições estabelecidas no
            Contrato Principal, que não tenham sido expressamente modificadas por este instrumento.
          </p>
        </div>

        <div className="mt-20 text-center space-y-12">
          <p>E por estarem justos e contratados, assinam eletronicamente o presente Aditivo.</p>
          <div className="grid grid-cols-2 gap-8 mt-12">
            <div className="border-t border-[#1b4382] pt-2 text-center print:border-black">
              <p className="font-bold text-[#1b4382] print:text-black">
                CONTACTO SOLUÇÕES EM TECNOLOGIA - LTDA
              </p>
              <p className="text-[11px] text-slate-500">CONTRATADA</p>
            </div>
            <div className="border-t border-[#1b4382] pt-2 text-center print:border-black">
              <p className="font-bold uppercase text-[#1b4382] print:text-black">
                {clientName || '[NOME DA EMPRESA]'}
              </p>
              <p className="text-[11px] text-slate-500">CONTRATANTE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
