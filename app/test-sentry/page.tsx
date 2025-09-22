'use client'

import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function TestSentryPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY_TEST_PAGE !== 'true') {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Página de teste do Sentry desabilitada.
      </div>
    )
  }

  const [errorGenerated, setErrorGenerated] = useState(false)
  const [logsGenerated, setLogsGenerated] = useState(false)
  const [sentryLogGenerated, setSentryLogGenerated] = useState(false)
  const [feedbackOpened, setFeedbackOpened] = useState(false)
  const generateError = () => {
    setErrorGenerated(true)
    // Isso irá gerar um erro que o Sentry deve capturar
    throw new Error('Erro de teste gerado para Sentry')
  }

  const generateLogs = () => {
    setLogsGenerated(true)
    // Testar diferentes tipos de logs
    console.log('Teste de log info - deve aparecer no Sentry!')
    console.warn('Teste de warning - deve aparecer no Sentry!')
    console.error('Teste de error log - deve aparecer no Sentry!')
  }

  const generateSentryLog = () => {
    setSentryLogGenerated(true)
    // Teste específico usando Sentry.logger conforme instruções
    Sentry.logger.info('User triggered test log', { log_source: 'sentry_test' })
  }

  const openFeedback = () => {
    setFeedbackOpened(true)
    // Abrir o widget de feedback do Sentry
    try {
      const feedback = Sentry.getFeedback()
      if (feedback) {
        feedback.createWidget()
      }
    } catch (error) {
      console.log('Feedback widget não disponível:', error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Verificar Sentry
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Teste todas as funcionalidades do Sentry: erros, logs e feedback de usuário.
        </p>

        <div className="space-y-4">
          <button
            onClick={generateError}
            className="w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            🔴 Gerar Erro de Teste
          </button>

          <button
            onClick={generateLogs}
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            🔵 Gerar Logs Console
          </button>

          <button
            onClick={generateSentryLog}
            className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            🟢 Sentry.logger.info Test
          </button>

          <button
            onClick={openFeedback}
            className="w-full rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            💬 Abrir User Feedback
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {errorGenerated && (
            <p className="text-red-600 dark:text-red-400">
              ✅ Erro gerado! Verifique o console e o painel do Sentry.
            </p>
          )}

          {logsGenerated && (
            <p className="text-blue-600 dark:text-blue-400">
              ✅ Logs console gerados! Verifique o painel do Sentry na seção de Logs.
            </p>
          )}

          {sentryLogGenerated && (
            <p className="text-green-600 dark:text-green-400">
              ✅ Log Sentry.logger.info enviado! Verifique no painel do Sentry.
            </p>
          )}

          {feedbackOpened && (
            <p className="text-purple-600 dark:text-purple-400">
              ✅ Widget de feedback aberto! Se não apareceu, procure o botão flutuante na página.
            </p>
          )}
        </div>

        <div className="mt-6 rounded bg-gray-100 p-4 dark:bg-gray-700">
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">💡 Dica:</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            O widget de User Feedback também aparece automaticamente como um botão flutuante na
            página. Procure por um ícone de feedback no canto da tela!
          </p>
        </div>
      </div>
    </div>
  )
}
