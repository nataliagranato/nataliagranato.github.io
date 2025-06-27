'use client'

import { useState, useEffect } from 'react'

interface NewsletterMetrics {
  newsletter: {
    status: string
    provider: string
  }
  subscribers: {
    total: number
    active: number
    pending: number
    recent_30_days: number
  }
  growth: {
    last_30_days: number
    growth_rate: string
  }
  tags: Record<string, number>
  last_updated: string
}

export default function NewsletterMetrics() {
  const [metrics, setMetrics] = useState<NewsletterMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/newsletter')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar métricas')
      }
      
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Erro: {error}</p>
          <button 
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Nenhuma métrica disponível</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Métricas da Newsletter
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Acompanhe o crescimento e estatísticas da sua newsletter
          </p>
          <div className="mt-2 flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              metrics.newsletter.status === 'funcionando' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {metrics.newsletter.status === 'funcionando' ? '✅ Funcionando' : '❌ Com Problemas'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Provedor: {metrics.newsletter.provider}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Inscritos"
            value={metrics.subscribers.total}
            icon="📧"
            iconBgColor="bg-blue-500"
          />
          <MetricCard
            title="Inscritos Ativos"
            value={metrics.subscribers.active}
            icon="✅"
            iconBgColor="bg-green-500"
          />
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Ativos
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {metrics.subscribers.active}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Subscribers */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Pendentes
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {metrics.subscribers.pending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Growth */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📈</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Últimos 30 dias
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      +{metrics.growth.last_30_days}
                    </dd>
                    <dd className="text-sm text-green-600 dark:text-green-400">
                      {metrics.growth.growth_rate}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        {Object.keys(metrics.tags).length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Distribuição por Tags
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(metrics.tags).map(([tag, count]) => (
                  <div key={tag} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {tag}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {count} inscritos
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Ações
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={fetchMetrics}
                className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
              >
                🔄 Atualizar Métricas
              </button>
              <a
                href="https://buttondown.email/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                📊 Dashboard Buttondown
              </a>
              <a
                href="/"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                🏠 Voltar ao Site
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Última atualização: {new Date(metrics.last_updated).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  )
}
