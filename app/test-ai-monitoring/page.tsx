'use client'

import { useState } from 'react'

export default function AITestPage() {
  const [prompt, setPrompt] = useState('')
  const [content, setContent] = useState('')
  const [response, setResponse] = useState('')
  const [streamResponse, setStreamResponse] = useState('')
  const [analysisResponse, setAnalysisResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const testChatAPI = async () => {
    setLoading(true)
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
    setLoading(false)
  }

  const testStreamAPI = async () => {
    setLoading(true)
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
        setStreamResponse(prev => prev + chunk)
      }
    } catch (error) {
      setStreamResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  const testAnalysisAPI = async () => {
    setLoading(true)
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
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Monitoring Test Page</h1>
      <p className="text-gray-600 mb-8">
        Esta página permite testar as APIs de AI e ver o monitoramento no Sentry em tempo real.
      </p>

      {/* Chat API Test */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">1. Chat API Test (generateText)</h2>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite seu prompt aqui..."
            className="w-full p-3 border rounded-md h-24"
          />
          <button
            onClick={testChatAPI}
            disabled={loading || !prompt}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Testar Chat API'}
          </button>
          {response && (
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {response}
            </pre>
          )}
        </div>
      </div>

      {/* Stream API Test */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">2. Stream API Test (streamText)</h2>
        <div className="space-y-4">
          <button
            onClick={testStreamAPI}
            disabled={loading || !prompt}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Streaming...' : 'Testar Stream API'}
          </button>
          {streamResponse && (
            <div className="bg-gray-100 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Stream Response:</h3>
              <div className="whitespace-pre-wrap">{streamResponse}</div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis API Test */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">3. Analysis API Test (generateObject)</h2>
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite um conteúdo para análise..."
            className="w-full p-3 border rounded-md h-24"
          />
          <button
            onClick={testAnalysisAPI}
            disabled={loading || !content}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Analisando...' : 'Testar Analysis API'}
          </button>
          {analysisResponse && (
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {analysisResponse}
            </pre>
          )}
        </div>
      </div>

      {/* Monitoring Info */}
      <div className="p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔍 Monitoramento Sentry</h2>
        <p className="text-gray-700 mb-2">
          Todas as operações de AI são automaticamente monitoradas pelo Sentry com:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Token usage e custos</li>
          <li>Latência das operações</li>
          <li>Inputs e outputs completos</li>
          <li>Traces detalhados</li>
          <li>Error tracking específico para AI</li>
        </ul>
        <p className="text-sm text-gray-600 mt-4">
          Verifique o dashboard do Sentry para ver as métricas em tempo real.
        </p>
      </div>
    </div>
  )
}