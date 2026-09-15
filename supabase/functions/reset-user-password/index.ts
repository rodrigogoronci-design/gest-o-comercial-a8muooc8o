import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function generateRandomPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Configuração do servidor incompleta (chaves ausentes).' }, 500)
    }

    // 1. Validar autenticação do chamador via JWT (Authorization Header)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Não autorizado: cabeçalho de autenticação ausente.' }, 401)
    }

    // Cliente com credenciais do chamador para validar o token JWT
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: callerUser },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !callerUser) {
      return jsonResponse(
        { error: 'Não autorizado: token inválido ou sessão expirada.' },
        401,
      )
    }

    // 2. Verificar se o chamador possui papel ADMINISTRADOR na tabela vc_perfis
    // Usamos o serviceRoleClient para consulta segura e autoritativa
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile, error: profileError } = await adminClient
      .from('vc_perfis')
      .select('papel, nome, email, ativo')
      .eq('user_id', callerUser.id)
      .maybeSingle()

    if (profileError || !callerProfile) {
      return jsonResponse(
        { error: 'Acesso negado: perfil de usuário não localizado no sistema Via Cargas.' },
        403,
      )
    }

    if (callerProfile.papel !== 'ADMINISTRADOR' || callerProfile.ativo === false) {
      return jsonResponse(
        { error: 'Acesso negado: apenas ADMINISTRADORES ativos podem redefinir senhas.' },
        403,
      )
    }

    // 3. Obter payload
    const body = await req.json().catch(() => ({}))
    const { targetUserId, customPassword, motivo, projetoId } = body

    if (!targetUserId) {
      return jsonResponse({ error: 'Parâmetro targetUserId é obrigatório.' }, 400)
    }

    // 4. Localizar usuário alvo em auth.users e vc_perfis
    const { data: targetAuthUser, error: targetAuthErr } =
      await adminClient.auth.admin.getUserById(targetUserId)

    if (targetAuthErr || !targetAuthUser?.user) {
      return jsonResponse({ error: 'Usuário alvo não encontrado no Supabase Auth.' }, 404)
    }

    const { data: targetProfile } = await adminClient
      .from('vc_perfis')
      .select('nome, email, papel')
      .eq('user_id', targetUserId)
      .maybeSingle()

    const targetEmail = targetAuthUser.user.email || targetProfile?.email || 'e-mail não definido'
    const targetNome = targetProfile?.nome || targetAuthUser.user.user_metadata?.name || targetEmail

    // 5. Definir a nova senha provisória
    const provisionalPassword =
      customPassword && typeof customPassword === 'string' && customPassword.trim().length >= 6
        ? customPassword.trim()
        : `Vc@${generateRandomPassword(8)}`

    // 6. Atualizar a senha via Admin API (sem alterar email ou outros metadados)
    const { data: updatedUserData, error: updateErr } =
      await adminClient.auth.admin.updateUserById(targetUserId, {
        password: provisionalPassword,
      })

    if (updateErr) {
      return jsonResponse(
        { error: `Erro ao redefinir senha no Supabase Auth: ${updateErr.message}` },
        500,
      )
    }

    // 7. Obter ID de projeto padrão se não fornecido
    let resolvedProjetoId = projetoId
    if (!resolvedProjetoId) {
      const { data: proj } = await adminClient
        .from('vc_projetos')
        .select('id')
        .eq('codigo', 'VC-OFICIAL')
        .maybeSingle()
      resolvedProjetoId = proj?.id || null
    }

    // 8. Registrar na trilha de auditoria vc_trilha_auditoria (INSERT apenas)
    const callerNome = callerProfile.nome || callerUser.email || 'Administrador'
    const auditMotivo =
      motivo ||
      `Senha provisória redefinida pelo Administrador ${callerNome} para o usuário ${targetNome} (${targetEmail}).`

    const { error: auditError } = await adminClient.from('vc_trilha_auditoria').insert({
      projeto_id: resolvedProjetoId,
      etapa_numero: null,
      usuario_id: callerUser.id,
      usuario_nome: callerNome,
      usuario_perfil: 'ADMINISTRADOR',
      acao: 'REDEFINIÇÃO DE SENHA PELO ADMINISTRADOR',
      campo: 'auth.users.password',
      valor_anterior: '•••••••• (criptografada)',
      valor_novo: 'Nova senha provisória gerada',
      motivo: auditMotivo,
      documento_relacionado: `Usuário ID: ${targetUserId} (${targetEmail})`,
      resultado_afetado: 'Acesso restaurado com senha provisória',
    })

    if (auditError) {
      console.warn('Aviso ao registrar trilha de auditoria para redefinição de senha:', auditError)
    }

    // 9. Retornar a senha provisória apenas uma vez para o modal
    return jsonResponse({
      success: true,
      message: 'Senha redefinida com sucesso.',
      targetUser: {
        id: targetUserId,
        email: targetEmail,
        nome: targetNome,
        papel: targetProfile?.papel || 'CONSULTOR',
      },
      provisionalPassword,
      generatedAt: new Date().toISOString(),
      adminExecutor: {
        id: callerUser.id,
        nome: callerNome,
      },
    })
  } catch (err: any) {
    return jsonResponse({ error: err?.message || 'Erro inesperado no servidor.' }, 500)
  }
})
