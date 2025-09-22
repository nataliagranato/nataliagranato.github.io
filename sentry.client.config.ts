// This file configures the initialization of Sentry on the client.
// The config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Capture console calls in the browser.
    // Compatibility layer: Sentry.captureConsoleIntegration was introduced in Sentry SDK v7.80.0.
    // For older SDK versions, fallback to Sentry.consoleLoggingIntegration.
    // Remove this fallback when minimum supported Sentry SDK version is >= 7.80.0.
    Sentry.captureConsoleIntegration ? 
      Sentry.captureConsoleIntegration({ levels: ['error', 'warn', 'info'] }) :
      Sentry.consoleLoggingIntegration({ levels: ['error', 'warn', 'info'] }),
    // User Feedback integration for collecting user feedback
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: 'system',
      // Disable auto-injection to prevent duplicate widgets
      autoInject: false,
    }),
  ],

  // Define how likely traces are sampled. Use env var with fallback to environment-based defaults
  // Lower default for production to reduce overhead
  tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE 
    ? parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
    : process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Enable debug based on env var or only for development
  debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true' || (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SENTRY_DEBUG !== 'false'),

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE 
    ? parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE)
    : 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE 
    ? parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE)
    : process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
})