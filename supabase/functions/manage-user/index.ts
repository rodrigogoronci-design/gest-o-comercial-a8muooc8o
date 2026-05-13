import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
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
      let authUser
      let colabId

      if (payload.systemAccess !== false && payload.email) {
        if (payload.sendInvite) {
          const { data, error } = await supabase.auth.admin.inviteUserByEmail(payload.email, {
            data: { name: payload.name },
          })
          if (error) throw error
          authUser = data.user
        } else {
          const { data, error } = await supabase.auth.admin.createUser({
            email: payload.email,
            password: payload.password || 'Skip@Pass123!',
            email_confirm: true,
            user_metadata: { name: payload.name },
          })
          if (error) throw error
          authUser = data.user
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
        departamento: payload.departamento || null,
        avatar_url: payload.avatar_url || null,
        recebe_transporte:
          payload.recebe_transporte === false || payload.recebe_transporte === 'false'
            ? false
            : true,
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
      if (dbErr) throw dbErr

      return new Response(JSON.stringify({ success: true, id: colabId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'resend_invite') {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(payload.email)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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

      if (authUserId) {
        if (systemAccess === false) {
          await supabase.auth.admin.deleteUser(authUserId)
          await supabase.from('colaboradores').update({ user_id: null }).eq('id', colabId)
        } else if (email) {
          const updateData: any = {
            email,
            user_metadata: { name },
            email_confirm: true,
          }
          if (password) updateData.password = password

          const { error: authErr } = await supabase.auth.admin.updateUserById(authUserId, updateData)
          if (authErr) {
            if (authErr.message.toLowerCase().includes('user not found')) {
              if (email) {
                const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
                  email,
                  password: password || 'Skip@Pass123!',
                  email_confirm: true,
                  user_metadata: { name },
                })
                if (!createErr) {
                  await supabase.from('colaboradores').update({ user_id: newAuth.user.id }).eq('id', colabId)
                }
              }
            } else {
              throw authErr
            }
          }
        }
      } else if (systemAccess !== false && email) {
        const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
          email,
          password: password || 'Skip@Pass123!',
          email_confirm: true,
          user_metadata: { name },
        })
        if (createErr) throw createErr

        await supabase
          .from('colaboradores')
          .update({ user_id: newAuth.user.id })
          .eq('id', colabId)
      }

      const receivesTransport =
        recebe_transporte === false || recebe_transporte === 'false' ? false : true

      const updateDataDb: any = {
        nome: name,
        role: mapRole(role),
        departamento: payload.departamento || null,
        recebe_transporte: receivesTransport,
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

      const { error: dbErr } = await supabase
        .from('colaboradores')
        .update(updateDataDb)
        .eq('id', colabId)

      if (dbErr) throw dbErr

      if (!receivesTransport) {
        await supabase.from('beneficios_transporte').delete().eq('colaborador_id', colabId)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
