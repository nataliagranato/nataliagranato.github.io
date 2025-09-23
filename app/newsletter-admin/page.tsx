'use client'

import { useEffect, useState } from 'react'

type NewsletterStats = {
  count: number
  subscribers: string[]
}

export default function NewsletterAdminPage() {
  const [stats, setStats] = useState<NewsletterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/newsletter-custom?action=subscribers')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Newsletter Admin</h1>
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Newsletter Admin</h1>
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-red-700">Erro: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Newsletter Admin</h1>
        
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-2xl font-bold text-blue-600">{stats?.count || 0}</div>
            <div className="text-sm text-gray-600">Total de Inscritos</div>
          </div>
          
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-2xl font-bold text-green-600">
              {stats?.subscribers.filter(email => email.includes('@')).length || 0}
            </div>
            <div className="text-sm text-gray-600">Emails Válidos</div>
          </div>
          
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-sm text-gray-600">Sistema Próprio</div>
          </div>
        </div>

        {/* Subscribers List */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Inscritos</h2>
          </div>
          
          <div className="p-6">
            {stats?.subscribers && stats.subscribers.length > 0 ? (
              <div className="space-y-2">
                {stats.subscribers.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                  >
                    <span className="font-mono text-sm">{email}</span>
                    <span className="text-xs text-gray-500">
                      #{String(index + 1).padStart(3, '0')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Nenhum inscrito encontrado
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 font-semibold text-blue-900">ℹ️ Informações do Sistema</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>✅ Sistema de newsletter 100% próprio</li>
            <li>✅ Armazenamento em Redis (sem dependências externas)</li>
            <li>✅ Rate limiting para prevenir spam</li>
            <li>✅ Validação de email integrada</li>
            <li>✅ Sistema de cancelamento com token</li>
            <li>✅ Mensagens em português</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            ← Voltar ao Blog
          </a>
        </div>
      </div>
    </div>
  )
}