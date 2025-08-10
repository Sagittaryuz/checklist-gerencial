import { supabase } from '../lib/supabase'
import { Database } from '../types/database'
import { v4 as uuidv4 } from 'uuid'

type ChecklistInsert = Database['public']['Tables']['checklists']['Insert']
type AnswerInsert = Database['public']['Tables']['answers']['Insert']
type MediaInsert = Database['public']['Tables']['media']['Insert']

export interface ChecklistSubmissionData {
  storeId: string
  location: {
    lat: number
    lng: number
    accuracy: number
  } | null
  answers: Record<string, {
    resposta: 'SIM' | 'MEIO' | 'NAO'
    justificativa?: string
    photos?: File[]
  }>
  score: number
  questions: Array<{
    id: string
    peso: number
  }>
}

export const checklistService = {
  async submitChecklist(data: ChecklistSubmissionData) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Usuário não autenticado')
      }

      // Get the current checklist version (assuming there's only one active version)
      const { data: versions, error: versionError } = await supabase
        .from('checklist_versions')
        .select('id')
        .eq('ativo', true)
        .limit(1)
        .single()

      if (versionError || !versions) {
        throw new Error('Versão do checklist não encontrada')
      }

      const checklistId = uuidv4()
      const now = new Date()

      // Create checklist record
      const checklistData: ChecklistInsert = {
        id: checklistId,
        version_id: versions.id,
        store_id: data.storeId,
        user_id: user.id,
        data_local: now.toISOString(),
        data_utc: now.toISOString(),
        lat: data.location?.lat || null,
        lng: data.location?.lng || null,
        acuracia: data.location?.accuracy || null,
        sem_gps: !data.location,
        score_total: data.score
      }

      const { error: checklistError } = await supabase
        .from('checklists')
        .insert(checklistData)

      if (checklistError) {
        throw new Error(`Erro ao salvar checklist: ${checklistError.message}`)
      }

      // Create answer records
      const answerPromises = Object.entries(data.answers).map(async ([questionId, answer]) => {
        const answerData: AnswerInsert = {
          checklist_id: checklistId,
          question_id: questionId,
          resposta: answer.resposta,
          justificativa: answer.justificativa || null
        }

        const { error: answerError } = await supabase
          .from('answers')
          .insert(answerData)

        if (answerError) {
          throw new Error(`Erro ao salvar resposta: ${answerError.message}`)
        }

        // Upload photos if any
        if (answer.photos && answer.photos.length > 0) {
          await this.uploadPhotos(checklistId, questionId, answer.photos)
        }
      })

      await Promise.all(answerPromises)

      return { success: true, checklistId }
    } catch (error) {
      console.error('Erro ao submeter checklist:', error)
      throw error
    }
  },

  async uploadPhotos(checklistId: string, questionId: string, photos: File[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const uploadPromises = photos.map(async (photo, index) => {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${user.id}/${checklistId}/${questionId}_${index}.${fileExt}`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('checklist-media')
          .upload(fileName, photo)

        if (uploadError) {
          throw new Error(`Erro ao fazer upload da foto: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('checklist-media')
          .getPublicUrl(fileName)

        // Save media record
        const mediaData: MediaInsert = {
          checklist_id: checklistId,
          question_id: questionId,
          tipo: 'foto',
          url: publicUrl,
          nome_arquivo: photo.name,
          tamanho: photo.size
        }

        const { error: mediaError } = await supabase
          .from('media')
          .insert(mediaData)

        if (mediaError) {
          throw new Error(`Erro ao salvar registro de mídia: ${mediaError.message}`)
        }

        return publicUrl
      })

      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Erro ao fazer upload das fotos:', error)
      throw error
    }
  },

  async getChecklists(filter?: 'all' | 'today' | 'week') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      let query = supabase
        .from('checklists')
        .select(`
          *,
          stores(nome),
          users(nome),
          checklist_versions(nome)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply date filters
      if (filter === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte('created_at', today.toISOString())
      } else if (filter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('created_at', weekAgo.toISOString())
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Erro ao buscar checklists: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar checklists:', error)
      throw error
    }
  },

  async getStores() {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        throw new Error(`Erro ao buscar lojas: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar lojas:', error)
      throw error
    }
  },

  async getQuestions() {
    try {
      // Get the current active checklist version
      const { data: version, error: versionError } = await supabase
        .from('checklist_versions')
        .select('id')
        .eq('ativo', true)
        .limit(1)
        .single()

      if (versionError || !version) {
        throw new Error('Versão do checklist não encontrada')
      }

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('version_id', version.id)
        .eq('ativo', true)
        .order('ordem')

      if (error) {
        throw new Error(`Erro ao buscar perguntas: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar perguntas:', error)
      throw error
    }
  }
}