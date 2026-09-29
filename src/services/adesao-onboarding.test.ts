import { describe, it, expect } from 'vitest'
import {
  generateSecureToken,
  buildAdmissaoUrl,
  generateAdmissaoWhatsappMessage,
} from './adesao-onboarding'
import { FICHA_OFICIAL_SECOES, UPLOAD_ITEM_MAPPING } from '@/config/ficha-adesao'

describe('Adesao Onboarding Services & Config', () => {
  it('generateSecureToken gera token seguro com comprimento adequado', () => {
    const token = generateSecureToken()
    expect(token).toBeDefined()
    expect(token.length).toBeGreaterThanOrEqual(32)
    expect(typeof token).toBe('string')
  })

  it('buildAdmissaoUrl monta URL correta com o token', () => {
    const token = 'abc123token456'
    const url = buildAdmissaoUrl(token)
    expect(url).toContain(`/admissao/${token}`)
  })

  it('generateAdmissaoWhatsappMessage gera texto cordial em PT-BR contendo o link e requisitos', () => {
    const msg = generateAdmissaoWhatsappMessage({
      clientName: 'Transportadora Alfa',
      linkUrl: 'https://exemplo.com/admissao/xyz',
      diasValidade: 30,
    })
    expect(msg).toContain('Transportadora Alfa')
    expect(msg).toContain('https://exemplo.com/admissao/xyz')
    expect(msg).toContain('Service Logic')
    expect(msg).toContain('30 dias')
    expect(msg).toContain('Cartão CNPJ')
    expect(msg).toContain('Certificado Digital A1')
  })

  it('FICHA_OFICIAL_SECOES contem todas as 7 secoes oficiais do documento Service Logic', () => {
    const secaoIds = FICHA_OFICIAL_SECOES.map((s) => s.id)
    expect(secaoIds).toEqual([
      'matriz',
      'filial',
      'certificado',
      'perfil_operacional',
      'identidade_visual',
      'responsavel_legal',
      'contatos',
    ])

    // Verifica campos de contatos (Ponto focal, Operacional, Financeiro)
    const contatosSecao = FICHA_OFICIAL_SECOES.find((s) => s.id === 'contatos')
    expect(contatosSecao).toBeDefined()
    const contatosKeys = contatosSecao?.campos.map((c) => c.key)
    expect(contatosKeys).toContain('pf_nome')
    expect(contatosKeys).toContain('pf_email')
    expect(contatosKeys).toContain('pf_telefone')
    expect(contatosKeys).toContain('ro_nome')
    expect(contatosKeys).toContain('ro_email')
    expect(contatosKeys).toContain('ro_telefone')
    expect(contatosKeys).toContain('rf_nome')
    expect(contatosKeys).toContain('rf_email')
    expect(contatosKeys).toContain('rf_telefone')
  })

  it('UPLOAD_ITEM_MAPPING mapeia uploads para os itens da tabela documentacao_adesao', () => {
    expect(UPLOAD_ITEM_MAPPING.matriz_cartao_cnpj.categoria).toBe('EMPRESA (Matriz)')
    expect(UPLOAD_ITEM_MAPPING.cert_arquivo.categoria).toBe('CERTIFICADO DIGITAL / SEFAZ')
    expect(UPLOAD_ITEM_MAPPING.id_logomarca.categoria).toBe('IDENTIDADE VISUAL')
    expect(UPLOAD_ITEM_MAPPING.rl_cnh.categoria).toBe('RESPONSÁVEL LEGAL')
  })
})
