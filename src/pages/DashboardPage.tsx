import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DashboardData } from '../types'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function DashboardPage() {
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', dateRange],
    queryFn: async (): Promise<DashboardData> => {
      // Simulated data for now - replace with actual API calls
      return {
        totalChecklists: 45,
        averageScore: 87.5,
        completionRate: 95.6,
        topFailures: [
          { question: 'Produtos da campanha disponíveis', failureRate: 23, category: 'Loja' },
          { question: 'Pontas de gôndola abastecidas', failureRate: 18, category: 'Loja' },
          { question: 'Ilhas promocionais abastecidas', failureRate: 15, category: 'Loja' }
        ],
        scoreByStore: [
          { store: 'Matriz', score: 92, count: 12 },
          { store: 'Catedral', score: 88, count: 10 },
          { store: 'Mineiros', score: 85, count: 8 },
          { store: 'Rharo', score: 90, count: 7 },
          { store: 'Said Abdala', score: 83, count: 5 },
          { store: 'Rio Verde', score: 87, count: 3 }
        ],
        scoreByCategory: [
          { category: 'Loja', score: 85, weight: 60 },
          { category: 'Atendimento', score: 92, weight: 25 },
          { category: 'Organização', score: 88, weight: 15 }
        ],
        recentChecklists: []
      }
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erro ao carregar dados do dashboard
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
          <span className="text-gray-400">até</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Checklists</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.totalChecklists}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pontuação Média</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.averageScore.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Taxa Conclusão</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Top Falhas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.topFailures.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score by Store */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pontuação por Loja</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.scoreByStore}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="store" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Pontuação']}
                labelFormatter={(label) => `Loja: ${label}`}
              />
              <Bar dataKey="score" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score by Category */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pontuação por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.scoreByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, score }) => `${category}: ${score}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="score"
              >
                {dashboardData.scoreByCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, 'Pontuação']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Failures */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Principais Falhas</h3>
        <div className="space-y-3">
          {dashboardData.topFailures.map((failure, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{failure.question}</p>
                <p className="text-sm text-gray-500">{failure.category}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-red-600">{failure.failureRate}%</p>
                <p className="text-xs text-gray-500">falhas</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}