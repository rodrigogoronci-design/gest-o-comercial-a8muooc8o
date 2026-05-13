import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import logoUrl from '@/assets/logomarca-service-ea011.png'

export function TrainingProposalDocument({
  clientName,
  cnpj,
  modules,
  price,
  date,
}: {
  clientName: string
  cnpj: string
  modules: { name: string; features: string[] }[]
  price: number
  date: string
}) {
  return (
    <div
      className="p-6 md:p-8 bg-white text-slate-800 font-sans text-xs max-w-4xl mx-auto min-h-auto print:m-0 print:p-8 print:shadow-none shadow-sm"
      id="training-proposal-print"
    >
      <div className="flex justify-between items-end border-b-2 border-orange-500 pb-2 mb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
            Proposta Comercial
          </h1>
          <h2 className="text-sm font-semibold uppercase text-slate-600 mt-1">
            Treinamento de Módulos
          </h2>
        </div>
        <div className="text-right flex items-center justify-end">
          <img src={logoUrl} alt="Service Logic" className="h-10 object-contain" />
        </div>
      </div>

      <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-200 flex gap-4 text-xs">
        <p className="flex-1">
          <strong className="text-slate-900 block mb-0.5 text-slate-500 uppercase text-[10px] tracking-wider">
            Cliente
          </strong>
          <span className="font-semibold text-sm">{clientName}</span>
        </p>
        <p className="flex-1">
          <strong className="text-slate-900 block mb-0.5 text-slate-500 uppercase text-[10px] tracking-wider">
            CNPJ
          </strong>
          <span className="font-semibold text-sm">{formatCNPJ(cnpj)}</span>
        </p>
        <p>
          <strong className="text-slate-900 block mb-0.5 text-slate-500 uppercase text-[10px] tracking-wider">
            Data da Proposta
          </strong>
          <span className="font-semibold text-sm">
            {new Date(date).toLocaleDateString('pt-BR')}
          </span>
        </p>
      </div>

      <div className="space-y-4 text-slate-700">
        <section>
          <h3 className="font-bold text-sm mb-1.5 text-slate-900 flex items-center gap-2">
            <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">
              1
            </span>
            Objeto da Proposta
          </h3>
          <p className="text-justify leading-relaxed ml-7">
            A presente proposta tem como objetivo a contratação de treinamento dos Módulos{' '}
            <strong>{modules.map((m) => m.name).join(', ')}</strong> do sistema Service Logic,
            visando proporcionar maior controle e automação dos processos administrativos e
            operacionais da CONTRATANTE.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-sm mb-1.5 text-slate-900 flex items-center gap-2">
            <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">
              2
            </span>
            Descrição dos Serviços
          </h3>
          <ul className="list-disc pl-4 space-y-1 ml-7">
            <li>
              <strong>Treinamentos:</strong> ao vivo, com capacitação prática e direcionada às
              necessidades da empresa.
            </li>
            <li>
              <strong>Gravação:</strong> registro completo das sessões para consulta futura da
              equipe.
            </li>
            <li>
              <strong>Pós-treinamento:</strong> suporte para esclarecimento de dúvidas e aplicação
              das práticas abordadas.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-sm mb-2 text-slate-900 flex items-center gap-2">
            <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">
              3
            </span>
            Funcionalidades Abrangidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
            {modules.map((mod, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <h4 className="font-bold mb-1.5 text-[#1e3a8a] text-xs border-b border-slate-200 pb-1">
                  Módulo {mod.name}
                </h4>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] leading-tight">
                  {mod.features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-sm mb-1.5 text-slate-900 flex items-center gap-2">
            <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">
              4
            </span>
            Investimento
          </h3>
          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded border border-emerald-100 ml-7">
            <p className="text-emerald-900 font-medium">
              Treinamento de {modules.length} módulo{modules.length > 1 ? 's' : ''}:
            </p>
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(price)}{' '}
              <span className="text-xs font-normal text-emerald-600">– pagamento único</span>
            </p>
          </div>
        </section>

        <section className="flex gap-6 pt-2">
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1.5 text-slate-900 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">
                5
              </span>
              Condições Gerais
            </h3>
            <ul className="list-disc pl-4 space-y-1 ml-7 text-[11px]">
              <li>
                O treinamento contempla orientação operacional para utilização dos módulos
                contratados.
              </li>
              <li>O agendamento será realizado conforme disponibilidade entre as partes.</li>
            </ul>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1.5 text-slate-900 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">
                6
              </span>
              Validade da Proposta
            </h3>
            <p className="ml-7 text-[11px]">
              Esta proposta possui validade de 15 dias a partir da data de envio.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
        <p className="font-semibold text-slate-700 mb-0.5">SERVICE LOGIC SOLUÇÕES EM TECNOLOGIA</p>
        <p>
          Av. Central, 1439, Sala 201, Ed. Comercial Santa Clara, Laranjeiras, Serra - ES. (27)
          2141-0107
        </p>
        <p className="text-blue-600 mt-0.5">www.servicelogic.com.br</p>
      </div>
    </div>
  )
}
