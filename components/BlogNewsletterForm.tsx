'use client'

import { useRef, useState, useTransition } from 'react'
import { subscribeToNewsletter, type NewsletterResult } from '@/lib/newsletter-actions'

interface BlogNewsletterFormProps {
  title?: string
  className?: string
}

export default function BlogNewsletterForm({
  title = 'Subscribe to the newsletter',
  className = '',
}: BlogNewsletterFormProps) {
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
    <div
      className={`not-prose border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Stay updated with the latest posts and insights.
      </p>
      <form ref={formRef} action={handleSubmit} className="mt-4 flex flex-col sm:flex-row">
        <div className="flex-1">
          <label htmlFor="blog-email-input" className="sr-only">
            Email address
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            id="blog-email-input"
            name="email"
            placeholder="Enter your email"
            required
            type="email"
            disabled={isPending}
          />
        </div>
        <div className="mt-3 flex w-full rounded-md shadow-sm sm:ml-3 sm:mt-0 sm:w-auto sm:flex-shrink-0">
          <button
            className={`w-full rounded-md bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-gray-800 ${
              isPending ? 'cursor-not-allowed opacity-50' : ''
            }`}
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      </form>

      {/* Status messages */}
      {result && (
        <div className="mt-3 text-sm">
          {result.success ? (
            <div className="text-green-600 dark:text-green-400">{result.message}</div>
          ) : (
            <div className="text-red-600 dark:text-red-400">{result.message}</div>
          )}
        </div>
      )}
    </div>
  )
}
