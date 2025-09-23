'use client'

import { useState, useEffect } from 'react'

export default function AITestPage() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [content, setContent] = useState('')
  const [response, setResponse] = useState('')
  const [streamResponse, setStreamResponse] = useState('')
  const [analysisResponse, setAnalysisResponse] = useState('')
  const [apiLoading, setApiLoading] = useState(false)

  useEffect(() => {
    // Verificar se a página está habilitada
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        setIsEnabled(data.enabled)
        setLoading(false)
      })
      .catch(() => {
        setIsEnabled(false)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Verificando disponibilidade...</div>
        </div>
      </div>
    )
  }

  if (!isEnabled) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold">Página Não Disponível</h1>
          <p className="mb-4 text-gray-600">
            A página de teste de AI Monitoring não está habilitada.
          </p>
          <p className="text-sm text-gray-500">
            Para habilitar esta página, configure{' '}
            <code className="rounded bg-gray-100 px-2 py-1">ENABLE_AI_MONITORING_PAGE=true</code> no
            arquivo .env
          </p>
        </div>
      </div>
    )
  }

  const testChatAPI = async () => {
    setApiLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setApiLoading(false)
  }

  const testStreamAPI = async () => {
    setApiLoading(true)
    setStreamResponse('')
    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        setStreamResponse((prev) => prev + chunk)
      }
    } catch (error) {
      setStreamResponse(`Error: ${error}`)
    }
    setApiLoading(false)
  }

  const testAnalysisAPI = async () => {
    setApiLoading(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      setAnalysisResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setAnalysisResponse(`Error: ${error}`)
    }
    setApiLoading(false)
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">AI Monitoring Test Page</h1>
      <p className="mb-8 text-gray-600">
        Esta página permite testar as APIs de AI e ver o monitoramento no Sentry em tempo real.
      </p>

      {/* Chat API Test */}
      <div className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">1. Chat API Test (generateText)</h2>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite seu prompt aqui..."
            className="h-24 w-full rounded-md border p-3"
          />
          <button
            onClick={testChatAPI}
            disabled={apiLoading || !prompt}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {apiLoading ? 'Gerando...' : 'Testar Chat API'}
          </button>
          {response && (
            <pre className="overflow-auto rounded-md bg-gray-100 p-4 text-sm">{response}</pre>
          )}
        </div>
      </div>

      {/* Stream API Test */}
      <div className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">2. Stream API Test (streamText)</h2>
        <div className="space-y-4">
          <button
            onClick={testStreamAPI}
            disabled={apiLoading || !prompt}
            className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
          >
            {apiLoading ? 'Streaming...' : 'Testar Stream API'}
          </button>
          {streamResponse && (
            <div className="rounded-md bg-gray-100 p-4">
              <h3 className="mb-2 font-semibold">Stream Response:</h3>
              <div className="whitespace-pre-wrap">{streamResponse}</div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis API Test */}
      <div className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">3. Analysis API Test (generateObject)</h2>
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite um conteúdo para análise..."
            className="h-24 w-full rounded-md border p-3"
          />
          <button
            onClick={testAnalysisAPI}
            disabled={apiLoading || !content}
            className="rounded-md bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
          >
            {apiLoading ? 'Analisando...' : 'Testar Analysis API'}
          </button>
          {analysisResponse && (
            <pre className="overflow-auto rounded-md bg-gray-100 p-4 text-sm">
              {analysisResponse}
            </pre>
          )}
        </div>
      </div>

      {/* Monitoring Info */}
      <div className="rounded-lg bg-blue-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">🔍 Monitoramento Sentry</h2>
        <p className="mb-2 text-gray-700">
          Todas as operações de AI são automaticamente monitoradas pelo Sentry com:
        </p>
        <ul className="list-inside list-disc space-y-1 text-gray-700">
          <li>Token usage e custos</li>
          <li>Latência das operações</li>
          <li>Inputs e outputs completos</li>
          <li>Traces detalhados</li>
          <li>Error tracking específico para AI</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          Verifique o dashboard do Sentry para ver as métricas em tempo real.
        </p>
      </div>
    </div>
  )
}
