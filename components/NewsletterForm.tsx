'use client'

import { FormEvent, useId, useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function NewsletterForm() {
  const emailId = useId()
  const honeypotId = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setStatus('loading')
    setMessage('')
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          company: form.get('company'),
        }),
      })
      const data = (await response.json().catch(() => null)) as { message?: string } | null
      const text =
        data?.message ||
        (response.ok
          ? 'Enviamos um e-mail de confirmação. Abra a caixa de entrada e clique no link para concluir a assinatura.'
          : 'Não foi possível concluir a inscrição. Tente novamente.')
      setMessage(text)
      setStatus(response.ok ? 'success' : 'error')
      if (response.ok) event.currentTarget.reset()
    } catch {
      setStatus('error')
      setMessage('Não foi possível concluir a inscrição. Tente novamente.')
    }
  }

  return (
    <section className="pt-8" aria-labelledby={`${emailId}-heading`}>
      <h2
        id={`${emailId}-heading`}
        className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
      >
        Newsletter
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Receba os posts novos do Tech Preta por e-mail. Sem spam: só quando sair um artigo, com
        título, resumo e link.
      </p>
      <form onSubmit={onSubmit} className="relative mt-4 max-w-xl" noValidate>
        <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor={honeypotId}>Empresa</label>
          <input
            id={honeypotId}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor={emailId}>
            E-mail
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-md bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {status === 'loading' ? 'Enviando…' : 'Quero assinar'}
          </button>
        </div>
      </form>
      {message && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-3 text-sm ${status === 'error' ? 'text-red-500' : 'text-primary-500'}`}
        >
          {message}
        </p>
      )}
    </section>
  )
}
