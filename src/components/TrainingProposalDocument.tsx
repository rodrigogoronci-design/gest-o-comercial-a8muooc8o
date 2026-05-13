import { formatCurrency, formatCNPJ } from '@/lib/formatters'

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
      className="p-8 bg-white text-slate-800 font-sans text-sm max-w-4xl mx-auto min-h-[1056px]"
      id="training-proposal-print"
    >
      <div className="flex justify-between items-center border-b-4 border-orange-500 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
            Proposta Comercial
          </h1>
          <h2 className="text-lg font-semibold uppercase text-slate-600 mt-1">
            Treinamento de Módulos
          </h2>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl italic">
              S
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="font-bold text-xl tracking-tight text-blue-900">SERVICE</span>
              <span className="font-bold text-xl tracking-tight text-blue-900">LOGIC</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-200">
        <p className="mb-1">
          <strong className="text-slate-900">Cliente:</strong> {clientName}
        </p>
        <p className="mb-1">
          <strong className="text-slate-900">CNPJ:</strong> {formatCNPJ(cnpj)}
        </p>
        <p>
          <strong className="text-slate-900">Data da Proposta:</strong>{' '}
          {new Date(date).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="space-y-6 text-slate-700">
        <section>
          <h3 className="font-bold text-base mb-2 text-slate-900">1. Objeto da Proposta</h3>
          <p className="text-justify leading-relaxed">
            A presente proposta tem como objetivo a contratação de treinamento dos Módulos{' '}
            <strong>{modules.map((m) => m.name).join(', ')}</strong> do sistema Service Logic,
            visando proporcionar maior controle e automação dos processos administrativos e
            operacionais da CONTRATANTE.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-base mb-2 text-slate-900">2. Descrição dos Serviços</h3>
          <p className="mb-3">
            Serviços a serem prestados com foco em diagnóstico, capacitação e aprimoramento do uso
            do sistema:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Treinamentos:</strong> treinamento ao vivo, com capacitação prática e
              direcionada às necessidades específicas da empresa.
            </li>
            <li>
              <strong>Gravação dos treinamentos:</strong> registro completo das sessões para
              consulta futura da equipe.
            </li>
            <li>
              <strong>Acompanhamento pós-treinamento:</strong> suporte para esclarecimento de
              dúvidas e verificação da aplicação das práticas abordadas.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-base mb-3 text-slate-900">
            3. Funcionalidades Abrangidas no Treinamento
          </h3>
          <div className="space-y-4">
            {modules.map((mod, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded border border-slate-100">
                <h4 className="font-bold mb-2 text-blue-900">Módulo {mod.name}</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {mod.features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-base mb-2 text-slate-900">4. Investimento</h3>
          <p className="mb-1">
            <strong>
              Treinamento dos módulos ({modules.length} módulo
              {modules.length > 1 ? 's' : ''}):
            </strong>
          </p>
          <p className="text-lg font-semibold text-emerald-700">
            {formatCurrency(price)} – pagamento único
          </p>
        </section>

        <section>
          <h3 className="font-bold text-base mb-2 text-slate-900">5. Condições Gerais</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              O treinamento contempla orientação operacional para utilização dos módulos
              contratados.
            </li>
            <li>O agendamento será realizado conforme disponibilidade entre as partes.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-base mb-2 text-slate-900">6. Validade da Proposta</h3>
          <p>Esta proposta possui validade de 15 dias a partir da data de envio.</p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <p className="mb-1 font-semibold">Service Logic Soluções em Tecnologia</p>
        <p className="mb-1">
          Av. Central, 1439, Sala 201, Ed. Comercial Santa Clara, Laranjeiras, Serra - ES. (27)
          2141-0107
        </p>
        <p className="text-blue-600 font-medium">www.servicelogic.com.br</p>
      </div>
    </div>
  )
}
