import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TestSentryClient from './TestSentryClient'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function TestSentryPage() {
  // Server-side environment gate - no client hooks involved
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY_TEST_PAGE !== 'true') {
    notFound()
  }

  // Render the client component only if environment allows
  return <TestSentryClient />
}
