import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, FileText, MapPin, User, Calendar } from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ChecklistWithDetails } from '../types'

export function ChecklistPage() {
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')

  const { data: checklists, isLoading, error } = useQuery({
    queryKey: ['checklists', filter],
    queryFn: async (): Promise<ChecklistWithDetails[]> => {
      // Simulated data for now - replace with actual API calls
      return [
        {
          id: '1',
          version_id: 'v1',
          store_id: 'store1',
          user_id: 'user1',
          data_local: '2024-01-15T10:30:00',
          data_utc: '2024-01-15T13:30:00Z',
          lat: -16.6869,
          lng: -49.2648,
          acuracia: 10,
          sem_gps: false,
          score_total: 87.5,
          created_at: '2024-01-15T13:30:00Z',
          updated_at: '2024-01-15T13:30:00Z',
          store: {
            id: 'store1',
            nome: 'Matriz',
            slug: 'matriz',
            ativo: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          user: {
            id: 'user1',
            nome: 'João Silva',
            email: 'joao@jcruzeiro.com',
            role: 'auditor' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          version: {
            id: 'v1',
            nome: 'Checklist v1.0',
            soma_pesos: 100,
            publicado_em: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          answers: []
        }
      ]
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erro ao carregar checklists
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
        <Link
          to="/checklist/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Checklist</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'today', label: 'Hoje' },
          { key: 'week', label: 'Esta semana' }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === filterOption.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Checklist List */}
      <div className="space-y-4">
        {checklists && checklists.length > 0 ? (
          checklists.map((checklist) => (
            <div key={checklist.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="font-medium text-gray-900">
                      {checklist.store.nome}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getScoreColor(checklist.score_total)
                    }`}>
                      {checklist.score_total.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{checklist.user.nome}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(checklist.data_local), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    
                    {checklist.lat && checklist.lng && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {checklist.lat.toFixed(6)}, {checklist.lng.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/checklist/${checklist.id}/result`}
                    className="btn-secondary text-xs"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum checklist encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando seu primeiro checklist
            </p>
            <Link
              to="/checklist/new"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Checklist</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}