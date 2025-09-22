// Test script to validate Sentry utility functions
import { parseSampleRate, SENTRY_DEFAULTS, shouldEnableDebug, shouldEnableLogs } from '../lib/sentry-utils'

console.log('🧪 Testing Sentry utility functions...\n')

// Test parseSampleRate function
console.log('📊 Testing parseSampleRate:')
console.log('Valid value 0.5:', parseSampleRate('0.5', 0.1)) // Should return 0.5
console.log('Invalid value "abc":', parseSampleRate('abc', 0.1)) // Should return 0.1 with warning
console.log('Invalid value "2.0":', parseSampleRate('2.0', 0.1)) // Should return 0.1 with warning
console.log('Invalid value "-0.1":', parseSampleRate('-0.1', 0.1)) // Should return 0.1 with warning
console.log('Undefined value:', parseSampleRate(undefined, 0.1)) // Should return 0.1
console.log('Empty string:', parseSampleRate('', 0.1)) // Should return 0.1

// Test SENTRY_DEFAULTS
console.log('\n📋 Testing SENTRY_DEFAULTS:')
console.log('Production traces sample rate:', SENTRY_DEFAULTS.TRACES_SAMPLE_RATE.production)
console.log('Development traces sample rate:', SENTRY_DEFAULTS.TRACES_SAMPLE_RATE.development)
console.log('Replays on error sample rate:', SENTRY_DEFAULTS.REPLAYS_ON_ERROR_SAMPLE_RATE)

// Test environment checks
console.log('\n🔧 Testing environment checks:')
console.log('Current NODE_ENV:', process.env.NODE_ENV)
console.log('Should enable debug:', shouldEnableDebug())
console.log('Should enable logs:', shouldEnableLogs())

console.log('\n✅ Test completed!')