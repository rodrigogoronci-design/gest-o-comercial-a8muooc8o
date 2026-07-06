import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export interface ColaboradorProfile {
  id: string
  nome: string
  cargo: string | null
  avatar_url: string | null
  image_gender: string | null
}

export function useColaboradorProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ColaboradorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('colaboradores')
      .select('id, nome, cargo, avatar_url, image_gender')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching colaborador profile:', error)
    } else if (data) {
      setProfile(data as ColaboradorProfile)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (nome: string, cargo: string) => {
    if (!user?.id) return { error: new Error('No authenticated user') }
    if (!nome.trim()) {
      toast.error('O nome é obrigatório')
      return { error: new Error('Nome is required') }
    }

    const { data, error } = await supabase
      .from('colaboradores')
      .update({ nome: nome.trim(), cargo: cargo.trim() })
      .eq('user_id', user.id)
      .select('id, nome, cargo, avatar_url, image_gender')
      .single()

    if (error) {
      toast.error('Erro ao atualizar perfil', { description: error.message })
      return { error }
    }

    if (data) {
      setProfile(data as ColaboradorProfile)
      toast.success('Perfil atualizado com sucesso!')
    }
    return { error: null }
  }

  return { profile, loading, fetchProfile, updateProfile }
}
