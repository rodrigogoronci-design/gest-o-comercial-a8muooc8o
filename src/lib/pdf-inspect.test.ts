import { describe, it } from 'vitest'
import { PDFParse } from 'pdf-parse'
import pdfAsset from '@/assets/documentosl-tms-web-00441-aee74.pdf'

describe('Inspect PDF via browser/vitest', () => {
  it('loads pdf asset and prints text', async () => {
    console.log('Asset URL/Path:', pdfAsset)
    // pdfAsset in vite might be a url string or data
  })
})
