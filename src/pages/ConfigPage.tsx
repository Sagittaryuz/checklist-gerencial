import { useState } from 'react'
import { Plus, Edit2, Trash2, Save, X, Eye, Settings, Users, Building } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface QuestionForm {
  id?: string
  categoria: string
  titulo: string
  peso: number
  ordem: number
  ativo: boolean
  obrigatoria: boolean
}

const SAMPLE_QUESTIONS = [
  {
    id: '1',
    categoria: 'Loja',
    titulo: 'Produtos da campanha disponíveis com amostra, preço e estoque?',
    peso: 25,
    ordem: 1,
    ativo: true,
    obrigatoria: true
  },
  {
    id: '2',
    categoria: 'Loja',
    titulo: 'Pontas de gôndola abastecidas e com cartazes?',
    peso: 20,
    ordem: 2,
    ativo: true,
    obrigatoria: true
  },
  {
    id: '3',
    categoria: 'Loja',
    titulo: 'Ilhas promocionais abastecidas e com cartazes?',
    peso: 25,
    ordem: 3,
    ativo: true,
    obrigatoria: true
  },
  {
    id: '4',
    categoria: 'Loja',
    titulo: 'Impressoras de etiquetas/cartazes funcionando?',
    peso: 15,
    ordem: 4,
    ativo: true,
    obrigatoria: false
  },
  {
    id: '5',
    categoria: 'Atendimento',
    titulo: 'Funcionários uniformizados e identificados?',
    peso: 15,
    ordem: 5,
    ativo: true,
    obrigatoria: true
  }
]

export function ConfigPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'questions' | 'users' | 'stores'>('questions')
  const [isEditing, setIsEditing] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionForm | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const isAdmin = user?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          Acesso restrito. Apenas administradores podem acessar as configurações.
        </div>
      </div>
    )
  }

  const totalWeight = SAMPLE_QUESTIONS
    .filter(q => q.ativo)
    .reduce((sum, q) => sum + q.peso, 0)

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setIsEditing(true)
  }

  const handleNewQuestion = () => {
    setEditingQuestion({
      categoria: 'Loja',
      titulo: '',
      peso: 10,
      ordem: SAMPLE_QUESTIONS.length + 1,
      ativo: true,
      obrigatoria: false
    })
    setIsEditing(true)
  }

  const handleSaveQuestion = () => {
    // Here you would save to Supabase
    console.log('Saving question:', editingQuestion)
    setIsEditing(false)
    setEditingQuestion(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingQuestion(null)
  }

  const tabs = [
    { key: 'questions', label: 'Perguntas', icon: Settings },
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'stores', label: 'Lojas', icon: Building }
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        {activeTab === 'questions' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Pré-visualizar</span>
            </button>
            <button
              onClick={handleNewQuestion}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Pergunta</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Weight Summary */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Resumo dos Pesos</h3>
                <p className="text-sm text-gray-500">Soma total dos pesos ativos</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  totalWeight === 100 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {totalWeight}
                </p>
                <p className="text-sm text-gray-500">de 100 pontos</p>
              </div>
            </div>
            {totalWeight !== 100 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ A soma dos pesos deve ser igual a 100 para publicar uma nova versão.
                </p>
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {SAMPLE_QUESTIONS
              .sort((a, b) => a.ordem - b.ordem)
              .map((question) => (
                <div key={question.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                          {question.categoria}
                        </span>
                        <span className="text-sm text-gray-500">
                          Peso: {question.peso}
                        </span>
                        <span className="text-sm text-gray-500">
                          Ordem: {question.ordem}
                        </span>
                        {question.obrigatoria && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            Obrigatória
                          </span>
                        )}
                        {!question.ativo && (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                            Inativa
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900">{question.titulo}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciar Usuários</h3>
          <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciar Lojas</h3>
          <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
        </div>
      )}

      {/* Edit Question Modal */}
      {isEditing && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingQuestion.id ? 'Editar Pergunta' : 'Nova Pergunta'}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editingQuestion.categoria}
                    onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, categoria: e.target.value } : null)}
                    className="input"
                  >
                    <option value="Loja">Loja</option>
                    <option value="Atendimento">Atendimento</option>
                    <option value="Organização">Organização</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Pergunta
                  </label>
                  <textarea
                    value={editingQuestion.titulo}
                    onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                    rows={3}
                    className="input resize-none"
                    placeholder="Digite a pergunta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editingQuestion.peso}
                      onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, peso: parseInt(e.target.value) || 0 } : null)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordem
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingQuestion.ordem}
                      onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, ordem: parseInt(e.target.value) || 0 } : null)}
                      className="input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingQuestion.ativo}
                      onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, ativo: e.target.checked } : null)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pergunta ativa</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingQuestion.obrigatoria}
                      onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, obrigatoria: e.target.checked } : null)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pergunta obrigatória</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveQuestion}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Pré-visualização do Questionário
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {SAMPLE_QUESTIONS
                  .filter(q => q.ativo)
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          {index + 1}. {question.categoria}
                        </span>
                        <span className="text-xs text-gray-400">
                          {question.peso}pts
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-3">
                        {question.titulo}
                        {question.obrigatoria && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="btn-success text-xs">SIM</button>
                        <button className="btn-warning text-xs">1/2</button>
                        <button className="btn-danger text-xs">NÃO</button>
                      </div>
                    </div>
                  ))
                }
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total de perguntas:</span>
                  <span className="font-medium">
                    {SAMPLE_QUESTIONS.filter(q => q.ativo).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Peso total:</span>
                  <span className={`font-medium ${
                    totalWeight === 100 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {totalWeight}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}