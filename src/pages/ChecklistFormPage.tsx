import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Camera, X, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { AnswerType, GeolocationPosition } from '../types'
import { checklistService } from '../services/checklistService'
import { LoadingSpinner } from '../components/LoadingSpinner'

// Stores will be loaded from Supabase

const SAMPLE_QUESTIONS = [
  {
    id: '1',
    categoria: 'Loja',
    titulo: 'Produtos da campanha disponíveis com amostra, preço e estoque?',
    peso: 25,
    ordem: 1,
    obrigatoria: true
  },
  {
    id: '2',
    categoria: 'Loja',
    titulo: 'Pontas de gôndola abastecidas e com cartazes?',
    peso: 20,
    ordem: 2,
    obrigatoria: true
  },
  {
    id: '3',
    categoria: 'Loja',
    titulo: 'Ilhas promocionais abastecidas e com cartazes?',
    peso: 25,
    ordem: 3,
    obrigatoria: true
  },
  {
    id: '4',
    categoria: 'Loja',
    titulo: 'Impressoras de etiquetas/cartazes funcionando?',
    peso: 15,
    ordem: 4,
    obrigatoria: false
  },
  {
    id: '5',
    categoria: 'Atendimento',
    titulo: 'Funcionários uniformizados e identificados?',
    peso: 15,
    ordem: 5,
    obrigatoria: true
  }
]

export function ChecklistFormPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'store' | 'location' | 'questions'>('store')
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [location, setLocation] = useState<GeolocationPosition['coords'] | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [answers, setAnswers] = useState<Record<string, {
    resposta?: AnswerType
    justificativa?: string
    photos: File[]
  }>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Load stores and questions on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [storesData, questionsData] = await Promise.all([
          checklistService.getStores(),
          checklistService.getQuestions()
        ])
        setStores(storesData)
        setQuestions(questionsData)
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error)
        setError(error.message || 'Erro ao carregar dados')
        // Fallback to sample data if Supabase fails
        setStores([
          { id: '1', nome: 'Matriz', slug: 'matriz' },
          { id: '2', nome: 'Catedral', slug: 'catedral' },
          { id: '3', nome: 'Mineiros', slug: 'mineiros' },
          { id: '4', nome: 'Rharo', slug: 'rharo' },
          { id: '5', nome: 'Said Abdala', slug: 'said-abdala' },
          { id: '6', nome: 'Rio Verde', slug: 'rio-verde' }
        ])
        setQuestions(SAMPLE_QUESTIONS)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredStores = stores.filter(store => 
    store.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStoreSelect = (storeId: string) => {
    setSelectedStore(storeId)
    setStep('location')
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador')
      setStep('questions')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords)
        setStep('questions')
      },
      (error) => {
        console.error('Erro ao obter localização:', error)
        setLocationError('Não foi possível obter a localização')
        setStep('questions')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const skipLocation = () => {
    setStep('questions')
  }

  const handleAnswerChange = (questionId: string, field: 'resposta' | 'justificativa', value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
        photos: prev[questionId]?.photos || []
      }
    }))
  }

  const handlePhotoAdd = (questionId: string, files: FileList) => {
    const newPhotos = Array.from(files)
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        photos: [...(prev[questionId]?.photos || []), ...newPhotos]
      }
    }))
  }

  const handlePhotoRemove = (questionId: string, photoIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        photos: prev[questionId]?.photos.filter((_, index) => index !== photoIndex) || []
      }
    }))
  }

  const calculateScore = () => {
    let totalScore = 0
    let totalWeight = 0

    questions.forEach(question => {
      const answer = answers[question.id]
      if (answer?.resposta) {
        const factor = answer.resposta === 'SIM' ? 1 : answer.resposta === 'MEIO' ? 0.5 : 0
        totalScore += question.peso * factor
        totalWeight += question.peso
      }
    })

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0
  }

  const isFormValid = () => {
    const requiredQuestions = questions.filter(q => q.obrigatoria)
    return requiredQuestions.every(question => {
      const answer = answers[question.id]
      return answer?.resposta && (answer.resposta === 'SIM' || answer.justificativa)
    })
  }

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert('Por favor, responda todas as perguntas obrigatórias')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const score = calculateScore()
      
      const submissionData = {
        storeId: selectedStore,
        location: location ? {
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy
        } : null,
        answers,
        score,
        questions: questions.map(q => ({ id: q.id, peso: q.peso }))
      }

      const result = await checklistService.submitChecklist(submissionData)
      
      if (result.success) {
        // Navigate to result page
        navigate('/checklist/new-result', { 
          state: { 
            score,
            store: stores.find(s => s.id === selectedStore),
            answers,
            questions,
            checklistId: result.checklistId
          }
        })
      }
    } catch (error: any) {
      console.error('Erro ao submeter checklist:', error)
      setError(error.message || 'Erro ao salvar checklist')
      alert(`Erro ao salvar checklist: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && stores.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (step === 'store') {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/checklist')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Novo Checklist</h1>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Qual unidade gostaria de registrar o checklist?
          </h2>
          
          <input
            type="text"
            placeholder="Buscar loja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input mb-4"
          />
          
          <div className="space-y-2">
            {filteredStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreSelect(store.id)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
              >
                <span className="font-medium text-gray-900">{store.nome}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'location') {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setStep('store')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Localização</h1>
        </div>

        <div className="card text-center">
          <MapPin className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Permitir acesso à localização?
          </h2>
          <p className="text-gray-600 mb-6">
            Isso nos ajuda a validar que o checklist está sendo realizado na loja correta.
          </p>
          
          {locationError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              {locationError}
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={requestLocation}
              className="btn-primary w-full"
            >
              Permitir Localização
            </button>
            <button
              onClick={skipLocation}
              className="btn-secondary w-full"
            >
              Pular (Continuar sem GPS)
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setStep('location')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checklist</h1>
            <p className="text-sm text-gray-500">
              {stores.find(s => s.id === selectedStore)?.nome}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-primary-600">
            {calculateScore().toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Pontuação</p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question) => {
          const answer = answers[question.id]
          const showJustification = answer?.resposta && answer.resposta !== 'SIM'
          
          return (
            <div key={question.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {question.titulo}
                    {question.obrigatoria && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {question.categoria}
                    </span>
                    <span>Peso: {question.peso}</span>
                  </div>
                </div>
              </div>
              
              {/* Answer Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { value: 'SIM', label: 'SIM', color: 'btn-success' },
                  { value: 'MEIO', label: '1/2', color: 'btn-warning' },
                  { value: 'NAO', label: 'NÃO', color: 'btn-danger' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswerChange(question.id, 'resposta', option.value as AnswerType)}
                    className={`${option.color} ${
                      answer?.resposta === option.value ? 'ring-2 ring-offset-2' : ''
                    }`}
                  >
                    {answer?.resposta === option.value && (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* Justification */}
              {showJustification && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justificativa
                  </label>
                  <textarea
                    value={answer?.justificativa || ''}
                    onChange={(e) => handleAnswerChange(question.id, 'justificativa', e.target.value)}
                    placeholder="Descreva o motivo da resposta (máx. 280 caracteres)"
                    maxLength={280}
                    rows={3}
                    className="input resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(answer?.justificativa || '').length}/280 caracteres
                  </p>
                </div>
              )}
              
              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fotos
                  </label>
                  <label className="btn-secondary text-xs cursor-pointer">
                    <Camera className="w-4 h-4 mr-1" />
                    Adicionar
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files && handlePhotoAdd(question.id, e.target.files)}
                    />
                  </label>
                </div>
                
                {answer?.photos && answer.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {answer.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handlePhotoRemove(question.id, index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      <div className="pb-6">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? 'Salvando...' : 'Finalizar Checklist'}
        </button>
        
        {!isFormValid() && (
          <div className="flex items-center space-x-2 mt-2 text-sm text-yellow-600">
            <AlertCircle className="w-4 h-4" />
            <span>Complete todas as perguntas obrigatórias para finalizar</span>
          </div>
        )}
      </div>
    </div>
  )
}