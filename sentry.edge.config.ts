// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { parseSampleRate, SENTRY_DEFAULTS, shouldEnableDebug, shouldEnableLogs } from './lib/sentry-utils'

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',

  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    // Only enable in production or when explicitly enabled
    ...(shouldEnableLogs() 
      ? [Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })]
      : []),
  ],

  // Define how likely traces are sampled. Use env var with fallback to environment-based defaults
  // Lower default for production to reduce overhead
  tracesSampleRate: parseSampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    process.env.NODE_ENV === 'production' 
      ? SENTRY_DEFAULTS.TRACES_SAMPLE_RATE.production 
      : SENTRY_DEFAULTS.TRACES_SAMPLE_RATE.development
  ),

  // Enable logs only when explicitly enabled or in production
  enableLogs: shouldEnableLogs(),

  // Disable debug by default in development to reduce noise
  debug: shouldEnableDebug(),
})
