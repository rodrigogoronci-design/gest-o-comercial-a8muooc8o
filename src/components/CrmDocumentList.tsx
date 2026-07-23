import { FileText, FileSignature, ExternalLink, FolderOpen, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentoAdesao } from '@/components/CrmAdhesionDocuments'

interface CrmDocumentListProps {
  propostaUrl: string | null | undefined
  documentosAdesao: DocumentoAdesao[]
  className?: string
}

function getFileNameFromUrl(url: string): string {
  const parts = url.split('/')
  const last = parts[parts.length - 1]
  if (!last) return 'arquivo'
  try {
    const decoded = decodeURIComponent(last)
    if (decoded.length > 50) return decoded.substring(0, 47) + '...'
    return decoded
  } catch {
    return last.length > 50 ? last.substring(0, 47) + '...' : last
  }
}

export function CrmDocumentList({
  propostaUrl,
  documentosAdesao,
  className,
}: CrmDocumentListProps) {
  const hasProposta = propostaUrl && propostaUrl.trim() !== ''
  const hasAdesao = documentosAdesao && documentosAdesao.length > 0
  const hasAny = hasProposta || hasAdesao

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">Documentos Anexados</h4>
        {hasAny && (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {(hasProposta ? 1 : 0) + (hasAdesao ? documentosAdesao.length : 0)} arquivo(s)
          </span>
        )}
      </div>

      {!hasAny ? (
        <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
          <Inbox className="h-3.5 w-3.5" />
          <span>Nenhum documento anexado a este prospecto.</span>
        </div>
      ) : (
        <div className="space-y-1.5 pl-6">
          {hasProposta && (
            <a
              href={propostaUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-md p-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
            >
              <FileSignature className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className="text-xs text-indigo-600 group-hover:text-indigo-800 font-medium flex-1 truncate">
                Proposta Comercial
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">PDF</span>
              <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
            </a>
          )}

          {hasAdesao &&
            documentosAdesao.map((doc, index) => (
              <a
                key={index}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-md p-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
              >
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs text-indigo-600 group-hover:text-indigo-800 font-medium flex-1 truncate">
                  {doc.nome || getFileNameFromUrl(doc.url)}
                </span>
                {doc.tipo && (
                  <span className="text-[10px] text-muted-foreground shrink-0 uppercase">
                    {doc.tipo}
                  </span>
                )}
                <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
              </a>
            ))}
        </div>
      )}
    </div>
  )
}
