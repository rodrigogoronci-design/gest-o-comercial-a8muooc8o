import { supabase } from '@/lib/supabase/client'
import { UPLOAD_ITEM_MAPPING } from '@/config/ficha-adesao'

export interface AdesaoLink {
  id: string
  cliente_id: string | null
  prospect_id: string | null
  proposta_id: string | null
  token: string
  expira_em: string
  status: 'ativo' | 'expirado' | 'revogado' | 'concluido'
  dias_validade: number
  criado_por: string | null
  criado_por_nome: string | null
  criado_em: string
  atualizado_em: string
}

export interface AdesaoArquivoItem {
  id: string
  categoria: string
  item_chave: string
  item_label: string
  file_name: string
  file_size: number | null
  public_url: string
  criado_em: string
}

export interface AdesaoPublicData {
  valid: boolean
  reason?: 'not_found' | 'expirado' | 'revogado'
  link_id?: string
  token?: string
  status?: string
  status_submissao?: 'em_progresso' | 'enviado'
  expira_em?: string
  cliente_id?: string | null
  prospect_id?: string | null
  cliente_nome?: string
  cliente_cnpj?: string
  cliente_email?: string
  cliente_telefone?: string
  respostas?: Record<string, any>
  arquivos?: AdesaoArquivoItem[]
}

/**
 * Gera um token aleatório seguro (36 caracteres alfanuméricos)
 */
export function generateSecureToken(): string {
  const bytes = new Uint8Array(24)
  window.crypto.getRandomValues(bytes)
  const baseHex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return baseHex
}

/**
 * Cria ou regenera o link de adesão para um cliente (ou prospecto).
 * Se já existir link anterior ativo, ele é revogado/invalidado automaticamente.
 */
export async function createOrRegenerateAdesaoLink(params: {
  clienteId?: string | null
  prospectId?: string | null
  propostaId?: string | null
  diasValidade?: number
  criadoPorId?: string | null
  criadoPorNome?: string | null
}): Promise<AdesaoLink> {
  const {
    clienteId = null,
    prospectId = null,
    propostaId = null,
    diasValidade = 30,
    criadoPorId = null,
    criadoPorNome = null,
  } = params

  if (!clienteId && !prospectId) {
    throw new Error('É necessário informar clienteId ou prospectId para gerar o link.')
  }

  const clientAny = supabase as any

  // 1. Invalida links anteriores ativos deste cliente/prospecto
  let revokeQuery = clientAny
    .from('adesao_links')
    .update({ status: 'revogado', atualizado_em: new Date().toISOString() })
    .eq('status', 'ativo')

  if (clienteId) {
    revokeQuery = revokeQuery.eq('cliente_id', clienteId)
  } else if (prospectId) {
    revokeQuery = revokeQuery.eq('prospect_id', prospectId)
  }
  await revokeQuery

  // 2. Calcula data de expiração
  const expiraEm = new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000).toISOString()
  const token = generateSecureToken()

  // 3. Insere novo link
  const { data, error } = await clientAny
    .from('adesao_links')
    .insert({
      cliente_id: clienteId,
      prospect_id: prospectId,
      proposta_id: propostaId,
      token,
      expira_em: expiraEm,
      status: 'ativo',
      dias_validade: diasValidade,
      criado_por: criadoPorId,
      criado_por_nome: criadoPorNome,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as AdesaoLink
}

/**
 * Busca o link mais recente (ativo ou último gerado) de um cliente ou prospecto
 */
export async function getLatestAdesaoLink(
  clienteId?: string | null,
  prospectId?: string | null,
): Promise<AdesaoLink | null> {
  if (!clienteId && !prospectId) return null

  const clientAny = supabase as any
  let query = clientAny
    .from('adesao_links')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(1)

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  } else if (prospectId) {
    query = query.eq('prospect_id', prospectId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data as AdesaoLink | null
}

/**
 * Revoga um link ativo
 */
export async function revokeAdesaoLink(linkId: string): Promise<void> {
  const clientAny = supabase as any
  const { error } = await clientAny
    .from('adesao_links')
    .update({ status: 'revogado', atualizado_em: new Date().toISOString() })
    .eq('id', linkId)
  if (error) throw error
}

/**
 * Monta a URL pública completa para admissão
 */
export function buildAdmissaoUrl(token: string): string {
  return `${window.location.origin}/admissao/${token}`
}

/**
 * Gera mensagem cordial e profissional em PT-BR para WhatsApp apresentando a ficha cadastral
 */
export function generateAdmissaoWhatsappMessage(params: {
  clientName: string
  linkUrl: string
  diasValidade?: number
}): string {
  const { clientName, linkUrl, diasValidade = 30 } = params
  const greeting = clientName ? `Olá, equipe da *${clientName}*!` : 'Olá!'

  return [
    `${greeting}`,
    '',
    'É um prazer ter vocês com a *Service Logic*! Seja muito bem-vindo(a) à nossa plataforma de gestão comercial e operacional.',
    '',
    'Para darmos início à implantação e parametrização do seu sistema com total agilidade e segurança, disponibilizamos o seu portal exclusivo de admissão para o preenchimento da ficha cadastral e envio dos documentos necessários:',
    '',
    `🔗 *Acesse seu portal de adesão:*`,
    `${linkUrl}`,
    '',
    '📋 *Principais itens necessários:*',
    '• Cartão CNPJ e Contrato Social',
    '• Certificado Digital A1 (.pfx) com credenciais fiscais',
    '• Logomarca da empresa e CNH do responsável legal',
    '• Definição dos pontos focais (Projeto, Operacional e Financeiro)',
    '',
    `⏱️ *Validade do link:* ${diasValidade} dias (o progresso pode ser salvo a qualquer momento).`,
    '',
    'Ficamos à total disposição para quaisquer dúvidas!',
    'Equipe de Onboarding — Service Logic',
  ].join('\n')
}

/**
 * Consulta pública da admissão por token (sem exigir autenticação)
 */
export async function fetchAdesaoByToken(token: string): Promise<AdesaoPublicData> {
  const clientAny = supabase as any
  const { data, error } = await clientAny.rpc('get_adesao_link_public', { p_token: token })
  if (error) throw error
  return data as unknown as AdesaoPublicData
}

/**
 * Salva progresso parcial ou finaliza o preenchimento da ficha online
 */
export async function saveAdesaoProgresso(
  token: string,
  fichaDados: Record<string, any>,
  finalizar: boolean = false,
): Promise<{ success: boolean; resposta_id?: string; status_submissao?: string; error?: string }> {
  const clientAny = supabase as any
  const { data, error } = await clientAny.rpc('save_adesao_progresso', {
    p_token: token,
    p_ficha_dados: fichaDados,
    p_finalizar: finalizar,
  })
  if (error) throw error
  return data as unknown as {
    success: boolean
    resposta_id?: string
    status_submissao?: string
    error?: string
  }
}

/**
 * Upload de arquivo no Storage Supabase para o fluxo de adesão e vinculação em adesao_arquivos
 */
export async function uploadAdesaoArquivo(params: {
  linkId: string
  clienteId?: string | null
  itemChave: string
  file: File
}): Promise<AdesaoArquivoItem> {
  const { linkId, clienteId, itemChave, file } = params
  const mapping = UPLOAD_ITEM_MAPPING[itemChave]
  const categoria = mapping?.categoria || 'Geral'
  const itemLabel = mapping?.label || itemChave

  const safeClientDir = clienteId || `link-${linkId}`
  const safeBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${safeClientDir}/${itemChave}/${Date.now()}-${safeBaseName}`

  const { error: uploadError } = await supabase.storage
    .from('documentos_adesao')
    .upload(storagePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage
    .from('documentos_adesao')
    .getPublicUrl(storagePath)

  const publicUrl = publicUrlData.publicUrl

  // Upsert em adesao_arquivos
  const clientAny = supabase as any
  const { data, error: dbError } = await clientAny
    .from('adesao_arquivos')
    .upsert(
      {
        link_id: linkId,
        cliente_id: clienteId,
        categoria,
        item_chave: itemChave,
        item_label: itemLabel,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        public_url: publicUrl,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'link_id,item_chave' },
    )
    .select('*')
    .single()

  if (dbError) throw dbError

  // Se houver cliente_id vinculado, sincroniza também na tabela documentacao_adesao para visualização na aba
  if (clienteId && mapping) {
    try {
      await (supabase.from('documentacao_adesao') as any)
        .update({
          arquivo_url: publicUrl,
          uploaded_at: new Date().toISOString(),
          status: 'Recebida',
          updated_at: new Date().toISOString(),
        })
        .eq('cliente_id', clienteId)
        .eq('item', mapping.item)
    } catch {
      // Ignora erro não-bloqueante na tabela legada
    }
  }

  return data as AdesaoArquivoItem
}

/**
 * Exclui arquivo anexo da ficha de adesão
 */
export async function deleteAdesaoArquivo(linkId: string, itemChave: string): Promise<void> {
  const clientAny = supabase as any
  const { data: arq } = await clientAny
    .from('adesao_arquivos')
    .select('file_path')
    .eq('link_id', linkId)
    .eq('item_chave', itemChave)
    .maybeSingle()

  if (arq?.file_path) {
    await supabase.storage.from('documentos_adesao').remove([arq.file_path])
  }

  const { error } = await clientAny
    .from('adesao_arquivos')
    .delete()
    .eq('link_id', linkId)
    .eq('item_chave', itemChave)

  if (error) throw error
}

/**
 * Consulta respostas da ficha para exibição no painel comercial do cliente
 */
export async function getAdesaoRespostasForClient(clienteId: string): Promise<{
  resposta: any | null
  arquivos: AdesaoArquivoItem[]
  link: AdesaoLink | null
}> {
  const link = await getLatestAdesaoLink(clienteId)
  if (!link) {
    return { resposta: null, arquivos: [], link: null }
  }

  const clientAny = supabase as any
  const [{ data: resp }, { data: arqs }] = await Promise.all([
    clientAny.from('adesao_respostas').select('*').eq('link_id', link.id).maybeSingle(),
    clientAny
      .from('adesao_arquivos')
      .select('*')
      .eq('link_id', link.id)
      .order('criado_em', { ascending: true }),
  ])

  return {
    resposta: resp,
    arquivos: (arqs || []) as AdesaoArquivoItem[],
    link,
  }
}
