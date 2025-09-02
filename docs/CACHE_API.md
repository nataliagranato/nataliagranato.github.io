# Cache API Documentation

## Overview

The Cache API provides endpoints for managing the Redis cache system. This API is **protected by multiple security layers** to prevent unauthorized access and potential attacks.

## Security Features

### 🔒 Environment-based Access Control
- **Development**: Full access without authentication
- **Production**: Requires API key authentication

### 🛡️ Authentication
- Requires `CACHE_API_KEY` environment variable in production
- API key can be provided via:
  - `X-API-Key` header
  - `Authorization: Bearer <key>` header

### 🌐 IP Allowlist (Optional)
- Configure `CACHE_ALLOWED_IPS` environment variable
- Comma-separated list of allowed IP addresses

### ⚡ Rate Limiting
- Maximum 10 requests per minute per IP address
- Prevents DoS attacks and cache flooding

## Environment Variables

```bash
# Required in production
CACHE_API_KEY=your-super-secret-cache-api-key-here

# Optional: IP allowlist
CACHE_ALLOWED_IPS=192.168.1.1,10.0.0.1
```

## API Endpoints

### Key Format Validation

All cache keys must follow the format `prefix:identifier` where:
- `prefix`: The cache category (e.g., "posts", "tags", "pages")
- `identifier`: The specific item identifier (e.g., "all", "kubernetes", "1")

**Valid examples:**
- `posts:all`
- `tags:kubernetes`
- `pages:1`
- `post:my-blog-post`

**Invalid examples:**
- `posts` (missing colon and identifier)
- `:all` (missing prefix)
- `posts:` (missing identifier)
- `posts:all:extra` (too many colons)

### GET /api/cache

#### Check Status
```bash
curl "http://localhost:3000/api/cache?action=status"
```

#### Get Cache Data
```bash
curl "http://localhost:3000/api/cache?action=get&key=posts:all" \
  -H "X-API-Key: <your-api-key>"
```

### POST /api/cache

#### Set Cache Data
```bash
curl -X POST "http://localhost:3000/api/cache" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{
    "action": "set",
    "key": "posts:all",
    "data": {...},
    "ttl": 3600
  }'
```

#### Clear Cache Prefix
```bash
curl -X POST "http://localhost:3000/api/cache" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{
    "action": "clear",
    "key": "posts"
  }'
```

### DELETE /api/cache

#### Delete Specific Cache Entry
```bash
curl -X DELETE "http://localhost:3000/api/cache?key=posts:all" \
  -H "X-API-Key: <your-api-key>"
```

#### Invalidate All Blog Cache
```bash
curl -X DELETE "http://localhost:3000/api/cache?action=invalidate-all" \
  -H "X-API-Key: <your-api-key>"
```

## REST Principles

The API follows REST principles for cache operations:

- **GET**: Retrieve cache data or status
- **POST**: Create/update cache entries or perform bulk operations
- **DELETE**: Remove specific cache entries or invalidate cache

### Available Actions

#### POST Actions
- `set`: Create or update a cache entry
- `clear`: Remove all entries matching a prefix

#### DELETE Actions
- Default (with key): Delete a specific cache entry
- `invalidate-all`: Clear all blog-related cache

## Error Responses

### 400 Bad Request - Invalid Key Format
```json
{
  "error": "Key parameter must be in prefix:identifier format (e.g., \"posts:all\")"
}
```

### 400 Bad Request - Missing Key
```json
{
  "error": "Key parameter is required"
}
```

### 400 Bad Request - Invalid Key Structure
```json
{
  "error": "Key parameter must have exactly one colon with non-empty prefix and identifier"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized: Invalid or missing API key"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: IP not allowed"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests: Rate limit exceeded"
}
```

## Security Best Practices

1. **Strong API Key**: Use a cryptographically secure random string
2. **Environment Variables**: Never commit API keys to version control
3. **IP Allowlist**: Restrict access to known trusted IPs when possible
4. **Monitoring**: Monitor API usage for unusual patterns
5. **Regular Rotation**: Rotate API keys periodically

## Development vs Production

### Development
- No authentication required
- Full access to all operations
- Useful for testing and debugging

### Production
- API key authentication mandatory
- Optional IP restrictions
- Rate limiting active
- All operations logged

## Example Scripts

### Generate Secure API Key
```bash
# Generate a 32-character random key
openssl rand -hex 32
```

### Test API Access
```bash
#!/bin/bash
API_KEY="your-api-key"
BASE_URL="https://your-domain.com"

# Test status (no auth required)
curl "${BASE_URL}/api/cache?action=status"

# Test authenticated operation
curl "${BASE_URL}/api/cache?action=get&key=posts:all" \
  -H "X-API-Key: ${API_KEY}"
```
