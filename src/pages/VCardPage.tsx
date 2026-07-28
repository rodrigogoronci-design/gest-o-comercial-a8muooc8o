import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

const VCARDS: Record<
  string,
  { fn: string; tel: string; email: string; org: string; title: string }
> = {
  rodrigo: {
    fn: "Rodrigo Goronci Sant'Ana",
    tel: '+55 27 99261-3681',
    email: 'rodrigo@servicelogic.com.br',
    org: 'Service Logic',
    title: 'Diretor',
  },
}

function buildVcf(data: {
  fn: string
  tel: string
  email: string
  org: string
  title: string
}): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.fn}`,
    `N:${data.fn.split(' ').slice(-1)[0]};${data.fn.split(' ').slice(0, -1).join(' ')};;;`,
    `TEL;TYPE=CELL:${data.tel}`,
    `EMAIL:${data.email}`,
    `ORG:${data.org}`,
    `TITLE:${data.title}`,
    'END:VCARD',
  ].join('\r\n')
}

export default function VCardPage() {
  const { slug } = useParams<{ slug: string }>()

  useEffect(() => {
    const data = slug ? VCARDS[slug] : undefined
    if (!data) return

    const vcfContent = buildVcf(data)
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.vcf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [slug])

  const data = slug ? VCARDS[slug] : undefined

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-4">
        {data ? (
          <>
            <p className="text-lg font-semibold text-slate-800">Contato baixado!</p>
            <p className="text-sm text-muted-foreground">
              O arquivo <strong>{slug}.vcf</strong> foi baixado. Abra-o para salvar o contato.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Contato não encontrado.</p>
        )}
      </div>
    </div>
  )
}
