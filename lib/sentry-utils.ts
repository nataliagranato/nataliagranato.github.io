// Sentry utility functions
// Shared utilities for safe Sentry configuration across client, server, and edge

/**
 * Safely parse sampling rates with validation
 * @param value - Environment variable value to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Valid sample rate between 0 and 1
 */
export function parseSampleRate(value: string | undefined, fallback: number): number {
  if (!value) return fallback

  const parsed = parseFloat(value)

  // Validate: must be a number between 0 and 1
  if (isNaN(parsed) || parsed < 0 || parsed > 1) {
    console.warn(`[Sentry] Invalid sample rate "${value}". Using fallback: ${fallback}`)
    return fallback
  }

  return parsed
}

/**
 * Get environment-specific default sample rates
 */
export const SENTRY_DEFAULTS = {
  TRACES_SAMPLE_RATE: {
    production: 0.05,
    development: 0.1,
  },
  REPLAYS_ON_ERROR_SAMPLE_RATE: 1.0,
  REPLAYS_SESSION_SAMPLE_RATE: {
    production: 0.1,
    development: 0.1,
  },
} as const

/**
 * Check if Sentry should be enabled based on environment
 */
export function shouldEnableSentry(): boolean {
  // Enable if DSN is provided (for any environment)
  return !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN)
}

/**
 * Check if debug mode should be enabled
 */
export function shouldEnableDebug(): boolean {
  return process.env.SENTRY_DEBUG === 'true' || process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true'
}

/**
 * Check if logs should be enabled
 */
export function shouldEnableLogs(): boolean {
  return process.env.SENTRY_ENABLE_LOGS === 'true' || process.env.NODE_ENV === 'production'
}
