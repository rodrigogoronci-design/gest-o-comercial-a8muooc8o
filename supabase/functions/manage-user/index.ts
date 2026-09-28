import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const EMAIL_IN_USE_ERROR = 'Este e-mail já está em uso por outro colaborador.'
const ORPHAN_LINKED_SUCCESS = 'Usuário vinculado com sucesso a partir de conta existente.'

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function emailInUseResponse() {
  return jsonResponse({ error: EMAIL_IN_USE_ERROR })
}

function isEmailConflict(err: any): boolean {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('already') || msg.includes('registered')
}

async function findOrphanedAuthUser(supabase: any, email: string): Promise<any | null> {
  const { data: userList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (!userList?.users) return null

  const normalized = email.trim().toLowerCase()
  const existing = userList.users.find((u: any) => u.email?.toLowerCase() === normalized)
  if (!existing) return null

  const { data: linked } = await supabase
    .from('colaboradores')
    .select('id')
    .eq('user_id', existing.id)
    .maybeSingle()

  if (linked) return null
  return existing
}

async function cleanupOrphanedAuthUser(supabase: any, email: string): Promise<boolean> {
  const orphan = await findOrphanedAuthUser(supabase, email)
  if (!orphan) return false
  await supabase.auth.admin.deleteUser(orphan.id)
  return true
}

async function createAuthUserSafely(
  supabase: any,
  email: string,
  password: string | undefined,
  name: string,
): Promise<any | null> {
  const userData = {
    email,
    password: password || 'Skip@Pass123!',
    email_confirm: true,
    user_metadata: { name, app_source: 'controle-de-beneficios' },
  }

  const { data, error } = await supabase.auth.admin.createUser(userData)
  if (!error) return data.user
  if (!isEmailConflict(error)) throw error

  const cleaned = await cleanupOrphanedAuthUser(supabase, email)
  if (!cleaned) return null

  const { data: retryData, error: retryErr } = await supabase.auth.admin.createUser(userData)
  if (retryErr) return null
  return retryData.user
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { action, payload } = await req.json()

    const mapRole = (r: string) => {
      if (!r) return 'Colaborador'
      const lower = r.toLowerCase()
      if (lower === 'admin') return 'Admin'
      if (lower === 'gerente') return 'Gerente'
      if (lower === 'colaborador') return 'Colaborador'
      if (lower === 'personalizado') return 'Personalizado'
      return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()
    }

    if (action === 'create') {
      let authUser: any = null
      let colabId: string

      if (payload.email) {
        const { data: existingColab } = await supabase
          .from('colaboradores')
          .select('id')
          .ilike('email', payload.email.trim().toLowerCase())
          .maybeSingle()

        if (existingColab) return emailInUseResponse()
      }

      if (payload.systemAccess !== false && payload.email) {
        if (payload.sendInvite) {
          const { data, error } = await supabase.auth.admin.inviteUserByEmail(payload.email, {
            data: { name: payload.name, app_source: 'controle-de-beneficios' },
          })
          if (error) {
            if (isEmailConflict(error)) {
              const orphan = await findOrphanedAuthUser(supabase, payload.email)
              if (orphan) {
                authUser = orphan
              } else {
                return emailInUseResponse()
              }
            } else {
              throw error
            }
          } else {
            authUser = data.user
          }
        } else {
          const orphan = await findOrphanedAuthUser(supabase, payload.email)
          if (orphan) {
            authUser = orphan
          } else {
            authUser = await createAuthUserSafely(supabase, payload.email, payload.password, payload.name)
            if (!authUser) return emailInUseResponse()
          }
        }
        if (!authUser) throw new Error('Falha ao criar usuário')
        colabId = authUser.id
      } else {
        colabId = crypto.randomUUID()
      }

      const insertData: any = {
        id: colabId,
        user_id: authUser ? authUser.id : null,
        email: payload.email || null,
        nome: payload.name,
        role: mapRole(payload.role),
        app_source: 'controle-de-beneficios',
        departamento: payload.departamento || null,
        avatar_url: payload.avatar_url || null,
        recebe_transporte: payload.recebe_transporte === false || payload.recebe_transporte === 'false' ? false : true,
        cpf: payload.cpf || null,
        rg: payload.rg || null,
        data_nascimento: payload.data_nascimento || null,
        endereco: payload.endereco || null,
        telefone: payload.telefone || null,
        cargo: payload.cargo || null,
        data_admissao: payload.data_admissao || null,
        salario: payload.salario ? parseFloat(payload.salario) : null,
        tipo_contrato: payload.tipo_contrato || 'CLT',
        codigo_funcionario: payload.codigo_funcionario || null,
      }

      if (payload.chave_pix !== undefined) insertData.chave_pix = payload.chave_pix
      if (payload.tipo_chave_pix !== undefined) insertData.tipo_chave_pix = payload.tipo_chave_pix

      const { error: dbErr } = await supabase.from('colaboradores').insert(insertData)
      if (dbErr) {
        if (authUser) await supabase.auth.admin.deleteUser(authUser.id)
        throw dbErr
      }

      return jsonResponse({ success: true, id: colabId, linked: !!(payload.sendInvite || payload.systemAccess !== false) })
    }

    if (action === 'resend_invite') {
      const { error } = await supabase.auth.admin.inviteUserByEmail(payload.email)
      if (error) throw error
      return jsonResponse({ success: true })
    }

    if (action === 'delete') {
      const { data: colab } = await supabase
        .from('colaboradores')
        .select('user_id')
        .eq('id', payload.id)
        .single()
      const authUserId = colab?.user_id || payload.id

      const { error: dbErr } = await supabase.from('colaboradores').delete().eq('id', payload.id)
      if (dbErr) throw dbErr

      if (authUserId) {
        const { error } = await supabase.auth.admin.deleteUser(authUserId)
        if (error && !error.message.toLowerCase().includes('user not found')) {
          console.error('Error deleting auth user:', error)
        }
      }

      return jsonResponse({ success: true })
    }

    if (action === 'check_conflict') {
      const { email } = payload
      if (!email) return jsonResponse({ conflict: false })

      const normalized = email.trim().toLowerCase()

      const { data: colabByEmail } = await supabase
        .from('colaboradores')
        .select('id, nome, email, user_id, status')
        .ilike('email', normalized)
        .maybeSingle()

      if (colabByEmail) {
        return jsonResponse({
          conflict: true,
          type: 'colaboradores',
          record: colabByEmail,
          message: `Este e-mail já está vinculado ao colaborador: ${colabByEmail.nome}.`,
        })
      }

      const orphan = await findOrphanedAuthUser(supabase, email)
      if (orphan) {
        return jsonResponse({
          conflict: true,
          type: 'orphaned_auth',
          record: { id: orphan.id, email: orphan.email },
          message: 'Existe uma conta de autenticação órfã (sem vínculo a colaborador) com este e-mail. O sistema pode vinculá-la automaticamente ao criar o colaborador.',
          canAutoResolve: true,
        })
      }

      return jsonResponse({ conflict: false })
    }

    if (action === 'update') {
      const { id, email, name, role, password, recebe_transporte, systemAccess } = payload

      const { data: colab } = await supabase
        .from('colaboradores')
        .select('id, user_id')
        .or(`id.eq.${id},user_id.eq.${id}`)
        .single()

      const authUserId = colab?.user_id
      const colabId = colab?.id || id

      if (email) {
        const { data: emailConflict } = await supabase
          .from('colaboradores')
          .select('id')
          .ilike('email', email.trim().toLowerCase())
          .neq('id', colabId)
          .maybeSingle()

        if (emailConflict) return emailInUseResponse()
      }

      if (authUserId) {
        if (systemAccess === false) {
          await supabase.auth.admin.deleteUser(authUserId)
          await supabase.from('colaboradores').update({ user_id: null }).eq('id', colabId)
        } else if (email) {
          const updateData: any = {
            email,
            user_metadata: { name, app_source: 'controle-de-beneficios' },
            email_confirm: true,
          }
          if (password) updateData.password = password

          const { error: authErr } = await supabase.auth.admin.updateUserById(authUserId, updateData)
          if (authErr) {
            if (isEmailConflict(authErr)) {
              const orphan = await findOrphanedAuthUser(supabase, email)
              if (orphan) {
                await supabase.from('colaboradores').update({ user_id: orphan.id }).eq('id', colabId)
              } else {
                return emailInUseResponse()
              }
            } else if (authErr.message.toLowerCase().includes('user not found')) {
              const newAuth = await createAuthUserSafely(supabase, email, password, name)
              if (!newAuth) return emailInUseResponse()
              await supabase.from('colaboradores').update({ user_id: newAuth.id }).eq('id', colabId)
            } else {
              throw authErr
            }
          }
        }
      } else if (systemAccess !== false && email) {
        const orphan = await findOrphanedAuthUser(supabase, email)
        if (orphan) {
          await supabase.from('colaboradores').update({ user_id: orphan.id }).eq('id', colabId)
        } else {
          const newAuth = await createAuthUserSafely(supabase, email, password, name)
          if (!newAuth) return emailInUseResponse()
          await supabase.from('colaboradores').update({ user_id: newAuth.id }).eq('id', colabId)
        }
      }

      const receivesTransport = recebe_transporte === false || recebe_transporte === 'false' ? false : true

      const updateDataDb: any = {
        nome: name,
        role: mapRole(role),
        departamento: payload.departamento || null,
        recebe_transporte: receivesTransport,
        app_source: 'controle-de-beneficios',
      }
      if (email !== undefined) updateDataDb.email = email || null
      if (payload.avatar_url !== undefined) updateDataDb.avatar_url = payload.avatar_url
      if (payload.cpf !== undefined) updateDataDb.cpf = payload.cpf
      if (payload.rg !== undefined) updateDataDb.rg = payload.rg
      if (payload.data_nascimento !== undefined) updateDataDb.data_nascimento = payload.data_nascimento
      if (payload.endereco !== undefined) updateDataDb.endereco = payload.endereco
      if (payload.telefone !== undefined) updateDataDb.telefone = payload.telefone
      if (payload.cargo !== undefined) updateDataDb.cargo = payload.cargo
      if (payload.data_admissao !== undefined) updateDataDb.data_admissao = payload.data_admissao
      if (payload.salario !== undefined) updateDataDb.salario = payload.salario ? parseFloat(payload.salario) : null
      if (payload.tipo_contrato !== undefined) updateDataDb.tipo_contrato = payload.tipo_contrato
      if (payload.codigo_funcionario !== undefined) updateDataDb.codigo_funcionario = payload.codigo_funcionario
      if (payload.chave_pix !== undefined) updateDataDb.chave_pix = payload.chave_pix
      if (payload.tipo_chave_pix !== undefined) updateDataDb.tipo_chave_pix = payload.tipo_chave_pix

      const { error: dbErr } = await supabase.from('colaboradores').update(updateDataDb).eq('id', colabId)
      if (dbErr) throw dbErr

      if (!receivesTransport) {
        await supabase.from('beneficios_transporte').delete().eq('colaborador_id', colabId)
      }

      return jsonResponse({ success: true })
    }

    return jsonResponse({ error: 'Unknown action' })
  } catch (err: any) {
    return jsonResponse({ error: err.message })
  }
})
