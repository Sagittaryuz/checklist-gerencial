export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          nome: string
          slug: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          nome: string
          email: string
          role: 'admin' | 'auditor' | 'gestor'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          role: 'admin' | 'auditor' | 'gestor'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          role?: 'admin' | 'auditor' | 'gestor'
          created_at?: string
          updated_at?: string
        }
      }
      checklist_versions: {
        Row: {
          id: string
          nome: string
          soma_pesos: number
          publicado_em: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          soma_pesos: number
          publicado_em?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          soma_pesos?: number
          publicado_em?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          version_id: string
          categoria: string
          titulo: string
          peso: number
          ordem: number
          ativo: boolean
          obrigatoria: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          version_id: string
          categoria: string
          titulo: string
          peso: number
          ordem: number
          ativo?: boolean
          obrigatoria?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          categoria?: string
          titulo?: string
          peso?: number
          ordem?: number
          ativo?: boolean
          obrigatoria?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      checklists: {
        Row: {
          id: string
          version_id: string
          store_id: string
          user_id: string
          data_local: string
          data_utc: string
          lat: number | null
          lng: number | null
          acuracia: number | null
          sem_gps: boolean
          score_total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          version_id: string
          store_id: string
          user_id: string
          data_local: string
          data_utc: string
          lat?: number | null
          lng?: number | null
          acuracia?: number | null
          sem_gps?: boolean
          score_total: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          store_id?: string
          user_id?: string
          data_local?: string
          data_utc?: string
          lat?: number | null
          lng?: number | null
          acuracia?: number | null
          sem_gps?: boolean
          score_total?: number
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          checklist_id: string
          question_id: string
          resposta: 'SIM' | 'MEIO' | 'NAO'
          justificativa: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          checklist_id: string
          question_id: string
          resposta: 'SIM' | 'MEIO' | 'NAO'
          justificativa?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          checklist_id?: string
          question_id?: string
          resposta?: 'SIM' | 'MEIO' | 'NAO'
          justificativa?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          answer_id: string
          file_path: string
          content_type: string
          width: number | null
          height: number | null
          tamanho: number
          created_at: string
        }
        Insert: {
          id?: string
          answer_id: string
          file_path: string
          content_type: string
          width?: number | null
          height?: number | null
          tamanho: number
          created_at?: string
        }
        Update: {
          id?: string
          answer_id?: string
          file_path?: string
          content_type?: string
          width?: number | null
          height?: number | null
          tamanho?: number
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string
          acao: string
          payload: Json
          criado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          acao: string
          payload: Json
          criado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          acao?: string
          payload?: Json
          criado_em?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}