import { forwardRef } from 'react'
import { formatCNPJ, formatDate } from '@/lib/formatters'
import type { Atendimento } from '@/services/atendimentos'
import logoUrl from '@/assets/logomarca-service-ea011.png'

interface AtendimentoReportDocumentProps {
  clientName: string
  clientCnpj: string
  atendimentos: Atendimento[]
}

export const AtendimentoReportDocument = forwardRef<HTMLDivElement, AtendimentoReportDocumentProps>(
  ({ clientName, clientCnpj, atendimentos }, ref) => {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'UTC' })

    return (
      <div
        ref={ref}
        className="bg-white p-8 sm:p-12 text-slate-800 font-serif leading-relaxed print:p-0 print:text-black"
      >
        <div className="flex flex-col items-center mb-8 border-b-2 border-[#f37021] print:border-black pb-6">
          <div className="flex w-full justify-between items-center mb-4">
            <img src={logoUrl} alt="Service Logic" className="h-14 object-contain" />
            <h1 className="text-sm font-bold uppercase w-2/3 text-right leading-tight text-[#1b4382] print:text-black">
              Relatório de Atendimento ao Cliente
            </h1>
          </div>
          <p className="text-xs text-slate-500 print:text-black">Emitido em: {today}</p>
        </div>

        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg print:bg-transparent print:border-slate-300">
          <h3 className="font-bold uppercase mb-3 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
            Identificação do Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Nome do Cliente: </span>
              <span className="font-bold text-slate-800 print:text-black">{clientName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">CNPJ: </span>
              <span className="font-bold text-slate-800 print:text-black">
                {clientCnpj ? formatCNPJ(clientCnpj) : '—'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold uppercase mb-4 text-sm text-[#1b4382] border-l-4 border-[#f37021] pl-3 print:text-black print:border-slate-800">
            Registros de Atendimento ({atendimentos.length})
          </h3>

          {atendimentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg print:bg-transparent">
              <p className="text-sm text-slate-500 font-medium">
                Nenhum atendimento encontrado para este cliente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {atendimentos.map((atendimento, index) => (
                <div
                  key={atendimento.id}
                  className="border border-slate-200 rounded-lg p-4 print:border-slate-300 print:break-inside-avoid"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1b4382] text-white text-xs font-bold print:bg-slate-200 print:text-black">
                        {index + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Data do Atendimento:
                      </span>
                      <span className="text-sm font-bold text-slate-800 print:text-black">
                        {formatDate(atendimento.data_atendimento)}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                      Assunto
                    </span>
                    <p className="text-sm font-bold text-slate-800 print:text-black">
                      {atendimento.solicitacao}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                      Detalhamento do Atendimento
                    </span>
                    <div className="mt-1 bg-slate-50 border border-slate-100 rounded-md p-3 print:bg-transparent print:border-slate-200">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap print:text-black">
                        {atendimento.relatorio}
                      </p>
                    </div>
                  </div>
                  {atendimento.documento_url && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-[#1b4382] print:text-black">
                      <span className="font-medium">Documento anexado disponível.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="border-t border-[#1b4382] pt-2 text-center print:border-black">
              <p className="font-bold text-[#1b4382] print:text-black">
                CONTACTO SOLUÇÕES EM TECNOLOGIA
              </p>
              <p className="text-[11px] text-slate-500">Responsável Técnico</p>
            </div>
            <div className="border-t border-[#1b4382] pt-2 text-center print:border-black">
              <p className="font-bold uppercase text-[#1b4382] print:text-black">
                {clientName || '[CLIENTE]'}
              </p>
              <p className="text-[11px] text-slate-500">Cliente</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

AtendimentoReportDocument.displayName = 'AtendimentoReportDocument'
