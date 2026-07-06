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

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return { error: new Error('No authenticated user') }
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido', { description: 'Use JPG, PNG ou WebP.' })
      return { error: new Error('Invalid file type') }
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'Máximo de 5MB.' })
      return { error: new Error('File too large') }
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error('Erro ao enviar imagem', { description: uploadError.message })
      return { error: uploadError }
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { data, error: updateError } = await supabase
      .from('colaboradores')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', user.id)
      .select('id, nome, cargo, avatar_url, image_gender')
      .single()

    if (updateError) {
      toast.error('Erro ao salvar foto', { description: updateError.message })
      return { error: updateError }
    }

    if (data) {
      setProfile(data as ColaboradorProfile)
      toast.success('Foto atualizada com sucesso!')
    }
    return { error: null }
  }

  const deleteAvatar = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return { error: new Error('No authenticated user') }
    }

    const { data: listData } = await supabase.storage.from('avatars').list(user.id)

    if (listData && listData.length > 0) {
      const filesToRemove = listData.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(filesToRemove)
    }

    const { data, error: updateError } = await supabase
      .from('colaboradores')
      .update({ avatar_url: null })
      .eq('user_id', user.id)
      .select('id, nome, cargo, avatar_url, image_gender')
      .single()

    if (updateError) {
      toast.error('Erro ao remover foto', { description: updateError.message })
      return { error: updateError }
    }

    if (data) {
      setProfile(data as ColaboradorProfile)
      toast.success('Foto removida com sucesso!')
    }
    return { error: null }
  }

  return { profile, loading, fetchProfile, updateProfile, uploadAvatar, deleteAvatar }
}
