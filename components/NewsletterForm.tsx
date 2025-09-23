'use client'

import { useRef, useState, useTransition } from 'react'
import { subscribeToNewsletter, type NewsletterResult } from '@/lib/newsletter-actions'

interface NewsletterFormProps {
  title?: string
  className?: string
}

export default function NewsletterForm({
  title = 'Subscribe to the newsletter',
  className = '',
}: NewsletterFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [result, setResult] = useState<NewsletterResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData)
      setResult(result)

      // Reset form on success
      if (result.success && formRef.current) {
        formRef.current.reset()
      }
    })
  }

  return (
    <div className={className}>
      <div className="pb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</div>
      <form ref={formRef} action={handleSubmit} className="flex flex-col sm:flex-row">
        <div className="flex-1">
          <label htmlFor="email-input" className="sr-only">
            Email address
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-md px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-black dark:text-gray-100"
            id="email-input"
            name="email"
            placeholder="Enter your email"
            required
            type="email"
            disabled={isPending}
          />
        </div>
        <div className="mt-2 flex w-full rounded-md shadow-sm sm:ml-3 sm:mt-0 sm:w-auto sm:flex-shrink-0">
          <button
            className={`w-full rounded-md bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-black ${
              isPending ? 'cursor-not-allowed opacity-50' : ''
            }`}
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Subscribing...' : 'Sign up'}
          </button>
        </div>
      </form>

      {/* Status messages */}
      {result && (
        <div className="mt-3 text-sm">
          {result.success ? (
            <div className="text-green-500 dark:text-green-400">{result.message}</div>
          ) : (
            <div className="text-red-500 dark:text-red-400">{result.message}</div>
          )}
        </div>
      )}
    </div>
  )
}
