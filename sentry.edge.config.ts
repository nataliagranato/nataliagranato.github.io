// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Define how likely traces are sampled. Use env var with fallback to environment-based defaults
  // Lower default for production to reduce overhead
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE 
    ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Enable logs by default, disable only when explicitly set to false via env var
  enableLogs: process.env.SENTRY_ENABLE_LOGS !== 'false',

  // Enable debug only for development or when explicitly enabled via env var
  debug: process.env.SENTRY_DEBUG === 'true' || (process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG !== 'false'),
})
