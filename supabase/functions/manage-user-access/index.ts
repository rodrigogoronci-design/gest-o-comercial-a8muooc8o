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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Configuração do servidor incompleta.' }, 500)
    }

    // 1. Validar autenticação do chamador
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Não autorizado: cabeçalho de autenticação ausente.' }, 401)
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: callerUser },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !callerUser) {
      return jsonResponse({ error: 'Não autorizado: token inválido ou sessão expirada.' }, 401)
    }

    // 2. Verificar se o chamador é ADMINISTRADOR ativo no Via Cargas
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
        { error: 'Acesso negado: apenas ADMINISTRADORES ativos podem gerenciar acessos.' },
        403,
      )
    }

    const callerNome = callerProfile.nome || callerUser.email || 'Administrador'

    // 3. Obter payload
    const body = await req.json().catch(() => ({}))
    const { action } = body

    // =========================================================================
    // ACTION: list - Lista de acessos completa com dados de auth.users e vc_perfis
    // =========================================================================
    if (action === 'list') {
      const { data: perfis, error: perfisErr } = await adminClient
        .from('vc_perfis')
        .select(`
          id,
          user_id,
          papel,
          nome,
          email,
          ativo,
          projeto_id,
          created_at,
          updated_at,
          vc_projetos:projeto_id (
            id,
            codigo,
            nome,
            tipo_projeto
          )
        `)
        .order('created_at', { ascending: true })

      if (perfisErr) {
        return jsonResponse({ error: `Erro ao listar perfis: ${perfisErr.message}` }, 500)
      }

      // Buscar metadados de auth.users para cada perfil
      const userIds = (perfis || []).map((p: any) => p.user_id)
      const usersMap: Record<string, any> = {}

      for (const uid of userIds) {
        const { data: authUser } = await adminClient.auth.admin.getUserById(uid)
        if (authUser?.user) {
          usersMap[uid] = authUser.user
        }
      }

      const formatted = (perfis || []).map((p: any) => {
        const authUser = usersMap[p.user_id]
        const lastSignIn = authUser?.last_sign_in_at || null
        const isConfirmed = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at)
        const invitedAt = authUser?.invited_at || null
        const statusConvite =
          !isConfirmed && invitedAt
            ? 'Convite pendente'
            : isConfirmed
              ? 'Acesso confirmado'
              : 'Pendente de ativação'

        return {
          id: p.id,
          userId: p.user_id,
          nome: p.nome || authUser?.user_metadata?.name || p.email,
          email: p.email || authUser?.email || '',
          perfil: p.papel,
          projetoId: p.projeto_id,
          projetoNome:
            p.vc_projetos?.nome || (p.projeto_id ? 'Projeto Vinculado' : 'Não vinculado'),
          projetoCodigo: p.vc_projetos?.codigo || null,
          situacao: p.ativo ? 'Ativo' : 'Inativo',
          ativo: p.ativo,
          ultimoAcesso: lastSignIn,
          statusConvite,
          isConfirmed,
          invitedAt,
          createdAt: p.created_at,
        }
      })

      return jsonResponse({ success: true, users: formatted })
    }

    // =========================================================================
    // ACTION: invite - Criar ou enviar convite por e-mail para definir senha
    // Requisitos:
    // 1. Criar ou atualizar o usuário no Supabase
    // 2. Vincular ao projeto selecionado
    // 3. Aplicar as permissões correspondentes ao perfil
    // 4. Enviar convite por e-mail via service role (inviteUserByEmail)
    // 5. Se já existir, retornar exists: true com detalhes para confirmação real na UI
    // =========================================================================
    if (action === 'invite') {
      const { nome, email, perfil, projetoId, situacao, allowUpdateIfExists, updateType } = body

      if (!nome || !email || !perfil || !projetoId) {
        return jsonResponse(
          {
            error: 'Campos obrigatórios ausentes: Nome, E-mail, Perfil e Projeto são necessários.',
          },
          400,
        )
      }

      const cleanEmail = String(email).trim().toLowerCase()
      const cleanNome = String(nome).trim()
      const cleanPerfil = String(perfil).trim().toUpperCase()
      const isAtivo = situacao === 'Ativo' || situacao === true || situacao === undefined

      // Validar perfil
      const allowedRoles = [
        'GESTOR',
        'ANALISTA',
        'CONSULTOR',
        'ADMINISTRADOR',
        'FINANCEIRO SERVICE LOGIC',
      ]
      if (!allowedRoles.includes(cleanPerfil)) {
        return jsonResponse(
          {
            error: `Perfil inválido: "${cleanPerfil}". Opções válidas: Gestor, Analista, Consultor.`,
          },
          400,
        )
      }

      // Validar existência do projeto
      const { data: proj, error: projErr } = await adminClient
        .from('vc_projetos')
        .select('id, codigo, nome')
        .eq('id', projetoId)
        .maybeSingle()

      if (projErr || !proj) {
        return jsonResponse({ error: 'Projeto selecionado não encontrado.' }, 404)
      }

      // Checar se já existe em auth.users ou vc_perfis
      const { data: existingPerfis } = await adminClient
        .from('vc_perfis')
        .select('id, user_id, papel, nome, email, ativo, projeto_id')
        .eq('email', cleanEmail)
        .maybeSingle()

      let existingAuthUser: any = null
      // Checar se já existe no Supabase Auth
      const { data: userList } = await adminClient.auth.admin.listUsers()
      if (userList?.users) {
        existingAuthUser = userList.users.find((u: any) => u.email?.toLowerCase() === cleanEmail)
      }

      // Se usuário já existe E não foi solicitada confirmação explícita de atualização
      if ((existingPerfis || existingAuthUser) && !allowUpdateIfExists) {
        return jsonResponse({
          exists: true,
          message:
            'ESTE USUÁRIO JÁ EXISTE. DESEJA ATUALIZAR O PERFIL OU VINCULÁ-LO A ESTE PROJETO?',
          existingUser: {
            id: existingPerfis?.id || null,
            userId: existingPerfis?.user_id || existingAuthUser?.id,
            nome: existingPerfis?.nome || existingAuthUser?.user_metadata?.name || cleanNome,
            email: cleanEmail,
            perfilAtual: existingPerfis?.papel || 'CONSULTOR',
            projetoAtualId: existingPerfis?.projeto_id || null,
            ativo: existingPerfis?.ativo ?? true,
          },
        })
      }

      // Se já existe e veio com instrução de atualização (allowUpdateIfExists = true)
      if (existingPerfis || existingAuthUser) {
        const targetUserId = existingPerfis?.user_id || existingAuthUser?.id
        const anteriorPerfil = existingPerfis?.papel || 'CONSULTOR'
        const anteriorProjetoId = existingPerfis?.projeto_id || null
        const anteriorAtivo = existingPerfis?.ativo ?? true

        const updatePayload: Record<string, any> = {
          nome: cleanNome,
          ativo: isAtivo,
          updated_at: new Date().toISOString(),
        }

        let auditAcao = 'ATUALIZAÇÃO DE ACESSO'
        let auditCampo = 'perfil/projeto'
        let auditValAnterior = `Perfil: ${anteriorPerfil}, Projeto: ${anteriorProjetoId}`
        let auditValNovo = ''

        if (updateType === 'perfil') {
          updatePayload.papel = cleanPerfil
          auditAcao = 'ATUALIZAÇÃO DE PERFIL'
          auditCampo = 'papel'
          auditValAnterior = anteriorPerfil
          auditValNovo = cleanPerfil
        } else if (updateType === 'projeto') {
          updatePayload.projeto_id = proj.id
          auditAcao = 'VINCULAÇÃO DE PROJETO'
          auditCampo = 'projeto_id'
          auditValAnterior = String(anteriorProjetoId || 'Nenhum')
          auditValNovo = `${proj.nome} (${proj.codigo})`
        } else {
          // Atualiza ambos
          updatePayload.papel = cleanPerfil
          updatePayload.projeto_id = proj.id
          auditValNovo = `Perfil: ${cleanPerfil}, Projeto: ${proj.nome}`
        }

        // Upsert no vc_perfis
        const { error: upErr } = await adminClient.from('vc_perfis').upsert({
          user_id: targetUserId,
          email: cleanEmail,
          ...updatePayload,
        })

        if (upErr) {
          return jsonResponse(
            { error: `Erro ao atualizar perfil do usuário: ${upErr.message}` },
            500,
          )
        }

        // Atualizar user_metadata no Auth
        await adminClient.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            name: cleanNome,
            papel: updatePayload.papel || anteriorPerfil,
            projeto_id: updatePayload.projeto_id || anteriorProjetoId,
          },
        })

        // Trilha de auditoria
        await adminClient.from('vc_trilha_auditoria').insert({
          projeto_id: proj.id,
          etapa_numero: null,
          usuario_id: callerUser.id,
          usuario_nome: callerNome,
          usuario_perfil: 'ADMINISTRADOR',
          acao: auditAcao,
          campo: auditCampo,
          valor_anterior: auditValAnterior,
          valor_novo: auditValNovo,
          motivo: `Atualização de acesso via painel do Administrador para ${cleanNome} (${cleanEmail}). Origem: Gestão de Acessos.`,
          documento_relacionado: `Usuário ID: ${targetUserId} (${cleanEmail})`,
          resultado_afetado: 'Acesso e permissões atualizados no sistema',
        })

        return jsonResponse({
          success: true,
          updated: true,
          message: 'Acesso atualizado com sucesso.',
        })
      }

      // NOVO USUÁRIO: Criar via inviteUserByEmail (Supabase Auth Admin)
      // NUNCA pedir ou exibir senha no painel; NÃO criar senha padrão; NÃO salvar senha em código, banco ou localStorage.
      const redirectOrigin =
        req.headers.get('origin') || 'https://projeto-via-cargas-30f44--preview.goskip.app'
      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        cleanEmail,
        {
          data: {
            name: cleanNome,
            papel: cleanPerfil,
            projeto_id: proj.id,
            invited_by: callerUser.id,
          },
          redirectTo: `${redirectOrigin}/reset-password`,
        },
      )

      if (inviteErr || !inviteData?.user) {
        return jsonResponse(
          {
            error: `Falha ao enviar convite via Supabase Auth: ${inviteErr?.message || 'Erro desconhecido'}`,
          },
          500,
        )
      }

      const newUserId = inviteData.user.id

      // Inserir registro em public.vc_perfis com papel, projeto e situação
      const { error: perfilInsertErr } = await adminClient.from('vc_perfis').insert({
        user_id: newUserId,
        papel: cleanPerfil,
        nome: cleanNome,
        email: cleanEmail,
        ativo: isAtivo,
        projeto_id: proj.id,
      })

      if (perfilInsertErr) {
        console.warn('Erro ao inserir vc_perfis após convite:', perfilInsertErr)
      }

      // Trilha de auditoria (INSERT apenas)
      await adminClient.from('vc_trilha_auditoria').insert({
        projeto_id: proj.id,
        etapa_numero: null,
        usuario_id: callerUser.id,
        usuario_nome: callerNome,
        usuario_perfil: 'ADMINISTRADOR',
        acao: 'CRIAÇÃO DE ACESSO E ENVIO DE CONVITE',
        campo: 'acesso_usuario',
        valor_anterior: 'Inexistente',
        valor_novo: `Nome: ${cleanNome}, Perfil: ${cleanPerfil}, Projeto: ${proj.nome}, Situação: ${isAtivo ? 'Ativo' : 'Inativo'}`,
        motivo: `Convite enviado por e-mail pelo Administrador ${callerNome} para definição de senha pelo próprio usuário. Origem: Painel do Administrador.`,
        documento_relacionado: `Usuário ID: ${newUserId} (${cleanEmail})`,
        resultado_afetado: 'Novo usuário provisionado no Supabase com permissões correspondentes',
      })

      return jsonResponse({
        success: true,
        created: true,
        message: 'ACESSO CRIADO — O USUÁRIO RECEBERÁ UM E-MAIL PARA DEFINIR SUA SENHA.',
      })
    }

    // =========================================================================
    // ACTION: resend-invite - Reenviar convite por e-mail
    // =========================================================================
    if (action === 'resend-invite') {
      const { userId, email, projetoId } = body
      const cleanEmail = String(email || '')
        .trim()
        .toLowerCase()

      if (!cleanEmail) {
        return jsonResponse({ error: 'E-mail é obrigatório para reenviar o convite.' }, 400)
      }

      const redirectOrigin =
        req.headers.get('origin') || 'https://projeto-via-cargas-30f44--preview.goskip.app'
      const { error: resendErr } = await adminClient.auth.admin.inviteUserByEmail(cleanEmail, {
        redirectTo: `${redirectOrigin}/reset-password`,
      })

      if (resendErr) {
        return jsonResponse({ error: `Erro ao reenviar convite: ${resendErr.message}` }, 500)
      }

      // Trilha de auditoria
      await adminClient.from('vc_trilha_auditoria').insert({
        projeto_id: projetoId || null,
        etapa_numero: null,
        usuario_id: callerUser.id,
        usuario_nome: callerNome,
        usuario_perfil: 'ADMINISTRADOR',
        acao: 'REENVIO DE CONVITE',
        campo: 'auth.users.invite',
        valor_anterior: 'Convite anterior pendente',
        valor_novo: 'Novo convite enviado por e-mail',
        motivo: `Reenvio de convite de acesso solicitado pelo Administrador ${callerNome} para ${cleanEmail}. Origem: Painel do Administrador.`,
        documento_relacionado: `E-mail: ${cleanEmail}`,
        resultado_afetado: 'E-mail de convite reenviado com novo token de confirmação',
      })

      return jsonResponse({
        success: true,
        message: 'CONVITE REENVIADO — O USUÁRIO RECEBERÁ UM NOVO E-MAIL PARA DEFINIR SUA SENHA.',
      })
    }

    // =========================================================================
    // ACTION: update-profile - Editar perfil
    // =========================================================================
    if (action === 'update-profile') {
      const { perfilId, novoPerfil, projetoId } = body
      if (!perfilId || !novoPerfil) {
        return jsonResponse({ error: 'ID do perfil e novo perfil são obrigatórios.' }, 400)
      }

      const { data: targetPerfil, error: getErr } = await adminClient
        .from('vc_perfis')
        .select('*')
        .eq('id', perfilId)
        .maybeSingle()

      if (getErr || !targetPerfil) {
        return jsonResponse({ error: 'Perfil não localizado.' }, 404)
      }

      const perfilAntigo = targetPerfil.papel

      const { error: updErr } = await adminClient
        .from('vc_perfis')
        .update({
          papel: novoPerfil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', perfilId)

      if (updErr) {
        return jsonResponse({ error: `Erro ao atualizar perfil: ${updErr.message}` }, 500)
      }

      // Trilha de auditoria
      await adminClient.from('vc_trilha_auditoria').insert({
        projeto_id: projetoId || targetPerfil.projeto_id || null,
        etapa_numero: null,
        usuario_id: callerUser.id,
        usuario_nome: callerNome,
        usuario_perfil: 'ADMINISTRADOR',
        acao: 'ALTERAÇÃO DE PERFIL',
        campo: 'vc_perfis.papel',
        valor_anterior: perfilAntigo,
        valor_novo: novoPerfil,
        motivo: `Alteração de perfil pelo Administrador ${callerNome} para ${targetPerfil.nome} (${targetPerfil.email}). Origem: Painel do Administrador.`,
        documento_relacionado: `Usuário ID: ${targetPerfil.user_id}`,
        resultado_afetado: 'Permissões operacionais alteradas conforme o novo perfil',
      })

      return jsonResponse({
        success: true,
        message: `Perfil atualizado de ${perfilAntigo} para ${novoPerfil} com sucesso.`,
      })
    }

    // =========================================================================
    // ACTION: update-project - Alterar projeto
    // =========================================================================
    if (action === 'update-project') {
      const { perfilId, novoProjetoId } = body
      if (!perfilId || !novoProjetoId) {
        return jsonResponse({ error: 'ID do perfil e novo projeto são obrigatórios.' }, 400)
      }

      const { data: targetPerfil, error: getErr } = await adminClient
        .from('vc_perfis')
        .select('*, vc_projetos:projeto_id(nome, codigo)')
        .eq('id', perfilId)
        .maybeSingle()

      if (getErr || !targetPerfil) {
        return jsonResponse({ error: 'Perfil não localizado.' }, 404)
      }

      const { data: novoProj } = await adminClient
        .from('vc_projetos')
        .select('id, codigo, nome')
        .eq('id', novoProjetoId)
        .maybeSingle()

      const projetoAntigo =
        targetPerfil.vc_projetos?.nome || targetPerfil.projeto_id || 'Não vinculado'

      const { error: updErr } = await adminClient
        .from('vc_perfis')
        .update({
          projeto_id: novoProjetoId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', perfilId)

      if (updErr) {
        return jsonResponse({ error: `Erro ao alterar projeto: ${updErr.message}` }, 500)
      }

      // Trilha de auditoria
      await adminClient.from('vc_trilha_auditoria').insert({
        projeto_id: novoProjetoId,
        etapa_numero: null,
        usuario_id: callerUser.id,
        usuario_nome: callerNome,
        usuario_perfil: 'ADMINISTRADOR',
        acao: 'ALTERAÇÃO DE PROJETO',
        campo: 'vc_perfis.projeto_id',
        valor_anterior: projetoAntigo,
        valor_novo: `${novoProj?.nome || novoProjetoId} (${novoProj?.codigo || ''})`,
        motivo: `Alteração do projeto vinculado pelo Administrador ${callerNome} para ${targetPerfil.nome}. Origem: Painel do Administrador.`,
        documento_relacionado: `Usuário ID: ${targetPerfil.user_id}`,
        resultado_afetado: 'Escopo de projeto do usuário alterado',
      })

      return jsonResponse({
        success: true,
        message: `Projeto vinculado atualizado para "${novoProj?.nome || 'Novo Projeto'}" com sucesso.`,
      })
    }

    // =========================================================================
    // ACTION: toggle-active - Ativar / Desativar usuário
    // Usuário inativo perde o acesso imediatamente via RLS (vc_is_member valida ativo = true)
    // =========================================================================
    if (action === 'toggle-active') {
      const { perfilId, ativo, projetoId } = body
      if (!perfilId || ativo === undefined) {
        return jsonResponse({ error: 'ID do perfil e novo estado de ativo são obrigatórios.' }, 400)
      }

      const { data: targetPerfil, error: getErr } = await adminClient
        .from('vc_perfis')
        .select('*')
        .eq('id', perfilId)
        .maybeSingle()

      if (getErr || !targetPerfil) {
        return jsonResponse({ error: 'Perfil não localizado.' }, 404)
      }

      const valorAnterior = targetPerfil.ativo ? 'Ativo' : 'Inativo'
      const valorNovo = ativo ? 'Ativo' : 'Inativo'

      const { error: updErr } = await adminClient
        .from('vc_perfis')
        .update({
          ativo: Boolean(ativo),
          updated_at: new Date().toISOString(),
        })
        .eq('id', perfilId)

      if (updErr) {
        return jsonResponse({ error: `Erro ao alterar situação: ${updErr.message}` }, 500)
      }

      // Trilha de auditoria
      await adminClient.from('vc_trilha_auditoria').insert({
        projeto_id: projetoId || targetPerfil.projeto_id || null,
        etapa_numero: null,
        usuario_id: callerUser.id,
        usuario_nome: callerNome,
        usuario_perfil: 'ADMINISTRADOR',
        acao: ativo ? 'ATIVAÇÃO DE ACESSO' : 'DESATIVAÇÃO DE ACESSO',
        campo: 'vc_perfis.ativo',
        valor_anterior: valorAnterior,
        valor_novo: valorNovo,
        motivo: `Situação do usuário alterada para ${valorNovo} pelo Administrador ${callerNome}. Usuário inativo perde imediatamente o acesso a todas as rotinas e tabelas Via Cargas via RLS. Origem: Painel do Administrador.`,
        documento_relacionado: `Usuário ID: ${targetPerfil.user_id} (${targetPerfil.email})`,
        resultado_afetado: ativo
          ? 'Acesso ao sistema restabelecido'
          : 'Acesso ao sistema revogado imediatamente',
      })

      return jsonResponse({
        success: true,
        ativo: Boolean(ativo),
        message: `Usuário ${targetPerfil.nome} foi ${ativo ? 'ativado' : 'desativado'} com sucesso.`,
      })
    }

    return jsonResponse({ error: `Ação não reconhecida: "${action}".` }, 400)
  } catch (err: any) {
    return jsonResponse({ error: err?.message || 'Erro inesperado no servidor.' }, 500)
  }
})
