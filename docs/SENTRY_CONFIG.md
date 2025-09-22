# Sentry Configuration

## Environment Variables

### Client-side (Browser)
These variables are prefixed with `NEXT_PUBLIC_` to be available in the browser:

- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for client-side error reporting
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` - Traces sample rate (default: 1.0 for dev, 0.05 for production)
- `NEXT_PUBLIC_SENTRY_DEBUG` - Enable debug mode (default: true for development)
- `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` - Replay sample rate on errors (default: 1.0)
- `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` - Replay sample rate for sessions (default: 0.1)

**Note**: Client-side console logs are captured via `captureConsoleIntegration` and cannot be disabled via `enableLogs` property.

### Server-side
- `SENTRY_DSN` - Sentry DSN for server-side error reporting
- `SENTRY_TRACES_SAMPLE_RATE` - Traces sample rate (default: 1.0 for dev, 0.05 for production)
- `SENTRY_DEBUG` - Enable debug mode (default: true for development)
- `SENTRY_ENABLE_LOGS` - Enable server-side logs (default: true, set to 'false' to disable)

### Build-time
- `SENTRY_ORG` - Sentry organization (default: nataliagranato)
- `SENTRY_PROJECT` - Sentry project (default: nataliagranato-xyz)

## Feedback Widget

The feedback widget is configured with `autoInject: false` to prevent duplicate widgets. To use the feedback widget in your application:

```typescript
import * as Sentry from '@sentry/nextjs'

const openFeedback = () => {
  try {
    const feedback = Sentry.getFeedback()
    if (feedback) {
      feedback.createWidget()
    }
  } catch (error) {
    console.log('Feedback widget not available:', error)
  }
}
```

## Production Recommendations

For production environments, set these environment variables:

```bash
SENTRY_TRACES_SAMPLE_RATE=0.05
SENTRY_ENABLE_LOGS=false  # Set to false to disable server-side logs
SENTRY_DEBUG=false
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05
NEXT_PUBLIC_SENTRY_DEBUG=false
```

**Note**: Logs are enabled by default. To disable them in production, explicitly set `SENTRY_ENABLE_LOGS=false`.