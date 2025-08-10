import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface PDFData {
  score: number
  store: {
    nome: string
  }
  user: {
    nome: string
  }
  answers: Record<string, {
    resposta: 'SIM' | 'MEIO' | 'NAO'
    justificativa?: string
    photos?: File[]
  }>
  questions: Array<{
    id: string
    titulo: string
    categoria: string
    peso: number
    obrigatoria: boolean
  }>
  checklistId?: string
}

export const pdfService = {
  async generateChecklistPDF(data: PDFData): Promise<Blob> {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let yPosition = 20

    // Helper function to add letterhead if available
    const addLetterhead = async () => {
      try {
        // Try to load letterhead from public folder
        const response = await fetch('/letterhead.pdf')
        if (response.ok) {
          // If letterhead exists, we could overlay it or reference it
          // For now, we'll just add a header with company info
        }
      } catch (error) {
        // Letterhead not found, continue without it
      }
      
      // Add company header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('J. CRUZEIRO', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text('Relatório de Checklist Gerencial', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20
    }

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
        return true
      }
      return false
    }

    // Add letterhead
    await addLetterhead()

    // Checklist Information
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Informações do Checklist', 20, yPosition)
    yPosition += 15

    const checklistInfo = [
      ['Loja:', data.store.nome],
      ['Auditor:', data.user.nome],
      ['Data:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
      ['Pontuação:', `${data.score.toFixed(1)}%`],
      ['Status:', data.score >= 90 ? 'Aprovado' : data.score >= 70 ? 'Atenção' : 'Reprovado']
    ]

    doc.autoTable({
      startY: yPosition,
      head: [],
      body: checklistInfo,
      theme: 'plain',
      styles: {
        fontSize: 12,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { cellWidth: 'auto' }
      }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20

    // Score Summary
    checkPageBreak(40)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo da Pontuação', 20, yPosition)
    yPosition += 15

    const scoreColor = data.score >= 90 ? [0, 128, 0] : data.score >= 70 ? [255, 165, 0] : [255, 0, 0]
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2])
    doc.rect(20, yPosition, 50, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`${data.score.toFixed(1)}%`, 45, yPosition + 13, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    yPosition += 35

    // Questions and Answers
    checkPageBreak(40)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalhamento das Respostas', 20, yPosition)
    yPosition += 15

    // Group questions by category
    const questionsByCategory = data.questions.reduce((acc, question) => {
      if (!acc[question.categoria]) {
        acc[question.categoria] = []
      }
      acc[question.categoria].push(question)
      return acc
    }, {} as Record<string, typeof data.questions>)

    // Process each category
    Object.entries(questionsByCategory).forEach(([category, questions]) => {
      checkPageBreak(30)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(category, 20, yPosition)
      yPosition += 10

      questions.forEach(question => {
        const answer = data.answers[question.id]
        if (!answer) return

        checkPageBreak(25)
        
        // Question title
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        const questionLines = doc.splitTextToSize(question.titulo, pageWidth - 40)
        doc.text(questionLines, 25, yPosition)
        yPosition += questionLines.length * 5 + 5

        // Answer
        doc.setFont('helvetica', 'normal')
        const answerColor = answer.resposta === 'SIM' ? [0, 128, 0] : 
                           answer.resposta === 'MEIO' ? [255, 165, 0] : [255, 0, 0]
        doc.setTextColor(answerColor[0], answerColor[1], answerColor[2])
        doc.text(`Resposta: ${answer.resposta}`, 30, yPosition)
        doc.setTextColor(0, 0, 0)
        yPosition += 8

        // Justification if exists
        if (answer.justificativa) {
          doc.setFont('helvetica', 'italic')
          const justificationLines = doc.splitTextToSize(`Justificativa: ${answer.justificativa}`, pageWidth - 60)
          doc.text(justificationLines, 30, yPosition)
          yPosition += justificationLines.length * 5 + 5
        }

        // Photos indicator
        if (answer.photos && answer.photos.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.text(`📷 ${answer.photos.length} foto(s) anexada(s)`, 30, yPosition)
          yPosition += 8
        }

        yPosition += 5 // Space between questions
      })

      yPosition += 10 // Space between categories
    })

    // Points of Attention
    const negativeAnswers = data.questions.filter(question => {
      const answer = data.answers[question.id]
      return answer?.resposta && answer.resposta !== 'SIM'
    })

    if (negativeAnswers.length > 0) {
      checkPageBreak(40)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(`Pontos de Atenção (${negativeAnswers.length})`, 20, yPosition)
      yPosition += 15

      negativeAnswers.forEach(question => {
        const answer = data.answers[question.id]
        const lostPoints = question.peso * (answer.resposta === 'MEIO' ? 0.5 : 1)
        
        checkPageBreak(20)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`• ${question.titulo}`, 25, yPosition)
        yPosition += 7
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(255, 0, 0)
        doc.text(`  Pontos perdidos: ${lostPoints}`, 30, yPosition)
        doc.setTextColor(0, 0, 0)
        yPosition += 10
      })
    }

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Página ${i} de ${totalPages} - Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    return doc.output('blob')
  },

  downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  async generateAndDownload(data: PDFData) {
    try {
      const blob = await this.generateChecklistPDF(data)
      const filename = `checklist_${data.store.nome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`
      this.downloadPDF(blob, filename)
      return { success: true }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      throw error
    }
  }
}