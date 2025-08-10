import { Database } from './database'

export type Store = Database['public']['Tables']['stores']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type ChecklistVersion = Database['public']['Tables']['checklist_versions']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Checklist = Database['public']['Tables']['checklists']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type Media = Database['public']['Tables']['media']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

export type UserRole = 'admin' | 'auditor' | 'gestor'
export type AnswerType = 'SIM' | 'MEIO' | 'NAO'

export interface ChecklistWithDetails extends Checklist {
  store: Store
  user: User
  version: ChecklistVersion
  answers: (Answer & {
    question: Question
    media: Media[]
  })[]
}

export interface QuestionWithAnswers extends Question {
  answers?: Answer[]
}

export interface ChecklistFormData {
  store_id: string
  answers: {
    question_id: string
    resposta: AnswerType
    justificativa?: string
    photos: File[]
  }[]
  location?: {
    lat: number
    lng: number
    accuracy: number
  }
}

export interface DashboardData {
  totalChecklists: number
  averageScore: number
  completionRate: number
  topFailures: {
    question: string
    failureRate: number
    category: string
  }[]
  scoreByStore: {
    store: string
    score: number
    count: number
  }[]
  scoreByCategory: {
    category: string
    score: number
    weight: number
  }[]
  recentChecklists: ChecklistWithDetails[]
}

export interface GeolocationPosition {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
  }
}

export interface ChecklistDraft {
  store_id: string
  answers: Record<string, {
    resposta?: AnswerType
    justificativa?: string
    photos: File[]
  }>
  location?: {
    lat: number
    lng: number
    accuracy: number
  }
  timestamp: number
}