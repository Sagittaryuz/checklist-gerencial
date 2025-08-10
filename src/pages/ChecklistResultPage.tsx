import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Share2, 
  FileText, 
  Camera,
  MapPin,
  User,
  Calendar,
  ArrowLeft
} from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { pdfService } from '../services/pdfService'

export function ChecklistResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const { score, store, answers, questions, checklistId } = location.state || {}

  if (!score || !store || !answers || !questions) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Dados do checklist não encontrados
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-8 h-8 text-green-600" />
    if (score >= 70) return <AlertTriangle className="w-8 h-8 text-yellow-600" />
    return <X className="w-8 h-8 text-red-600" />
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excelente! Checklist aprovado com nota alta.'
    if (score >= 70) return 'Bom resultado, mas há pontos para melhorar.'
    return 'Atenção! Vários itens precisam de correção.'
  }

  const negativeAnswers = questions.filter((question: any) => {
    const answer = answers[question.id]
    return answer?.resposta && answer.resposta !== 'SIM'
  })

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    
    try {
      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      const pdfData = {
        score,
        store,
        user,
        answers,
        questions,
        checklistId
      }

      await pdfService.generateAndDownload(pdfData)
      
      // Show success message
      alert('PDF gerado e baixado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      alert(`Erro ao gerar PDF: ${error.message}`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Checklist ${store.nome} - ${score.toFixed(1)}%`,
          text: `Checklist realizado na loja ${store.nome} com pontuação de ${score.toFixed(1)}%`,
          url: window.location.href
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copiado para a área de transferência!')
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/checklist')}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Resultado do Checklist</h1>
      </div>

      {/* Score Card */}
      <div className="card text-center">
        <div className="mb-4">
          {getScoreIcon(score)}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {score.toFixed(1)}%
        </h2>
        <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          getScoreColor(score)
        }`}>
          {getScoreMessage(score)}
        </p>
      </div>

      {/* Checklist Info */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Checklist</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">{store.nome}</span>
          </div>
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">{user?.nome}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">
              {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      {/* Negative Points */}
      {negativeAnswers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Pontos de Atenção ({negativeAnswers.length})
          </h3>
          <div className="space-y-4">
            {negativeAnswers.map((question: any) => {
              const answer = answers[question.id]
              const lostPoints = question.peso * (answer.resposta === 'MEIO' ? 0.5 : 1)
              
              return (
                <div key={question.id} className="border-l-4 border-red-400 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{question.titulo}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500">{question.categoria}</span>
                        <span className="text-sm font-medium text-red-600">
                          -{lostPoints} pontos
                        </span>
                      </div>
                      {answer.justificativa && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Justificativa:</strong> {answer.justificativa}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      answer.resposta === 'MEIO' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {answer.resposta === 'MEIO' ? '1/2' : 'NÃO'}
                    </span>
                  </div>
                  
                  {/* Photos */}
                  {answer.photos && answer.photos.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Camera className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {answer.photos.length} foto(s)
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {answer.photos.map((photo: any, index: number) => (
                          <img
                            key={index}
                            src={URL.createObjectURL(photo)}
                            alt={`Evidência ${index + 1}`}
                            className="w-full h-16 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary by Category */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo por Categoria</h3>
        <div className="space-y-3">
          {Object.entries(
            questions.reduce((acc: any, question: any) => {
              const answer = answers[question.id]
              if (!acc[question.categoria]) {
                acc[question.categoria] = { total: 0, scored: 0, weight: 0 }
              }
              
              acc[question.categoria].weight += question.peso
              
              if (answer?.resposta) {
                const factor = answer.resposta === 'SIM' ? 1 : answer.resposta === 'MEIO' ? 0.5 : 0
                acc[question.categoria].scored += question.peso * factor
                acc[question.categoria].total += question.peso
              }
              
              return acc
            }, {} as Record<string, { total: number; scored: number; weight: number }>)
          ).map(([category, data]: [string, any]) => {
            const categoryScore = data.total > 0 ? (data.scored / data.total) * 100 : 0
            
            return (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{category}</span>
                  <span className="text-sm text-gray-500 ml-2">({data.weight} pontos)</span>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  getScoreColor(categoryScore)
                }`}>
                  {categoryScore.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pb-6">
        <button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isGeneratingPDF ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
          <span>{isGeneratingPDF ? 'Gerando PDF...' : 'Gerar PDF'}</span>
        </button>
        
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="btn-secondary w-full flex items-center justify-center space-x-2"
        >
          {isSharing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Share2 className="w-5 h-5" />
          )}
          <span>{isSharing ? 'Compartilhando...' : 'Compartilhar'}</span>
        </button>
        
        <button
          onClick={() => navigate('/checklist')}
          className="btn-secondary w-full"
        >
          Voltar aos Checklists
        </button>
      </div>
    </div>
  )
}