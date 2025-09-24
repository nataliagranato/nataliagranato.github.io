# Natália Granato's Blog - GitHub Copilot Instructions

This is a Next.js 15.5.2 TypeScript blog application focused on Cloud Native, DevOps, and CNCF technologies. The codebase uses Contentlayer for MDX content management, Redis for caching, Sentry for monitoring, and is optimized for Vercel deployment.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap, Build, and Test the Repository

**Prerequisites:**
- Install Node.js 22.x (CRITICAL requirement - check with `node --version`)
- If Node.js 22.x is not available, install it:
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  source ~/.bashrc
  nvm install 22
  nvm use 22
  ```

**Setup:**
```bash
# Clone and navigate to repository
git clone https://github.com/nataliagranato/nataliagranato.github.io.git
cd nataliagranato.github.io

# Install dependencies - takes ~50 seconds, expect peer dependency warnings (these are normal)
npm install

# Setup environment variables
cp .env.example .env.local
```

**Build Process:**
```bash
# NEVER CANCEL: Build takes 45-60 seconds. Set timeout to 90+ minutes for safety.
# IMPORTANT: May fail with Google Fonts error in restricted networks - see troubleshooting section
npm run build
```

**Important Note on Network Dependencies:**
The build process requires access to `fonts.googleapis.com` to fetch the Space Grotesk font. In restricted network environments, this will cause the build to fail with:
```
`next/font` error: Failed to fetch 'Space Grotesk' from Google Fonts.
```
This is a known limitation. The application works correctly when fonts are available.

**Development Server:**
```bash
# ALWAYS run after setup. Starts in ~10 seconds
npm run dev
# Access at http://localhost:3000
```

**Linting and Code Quality:**
```bash
# ALWAYS run before committing changes - takes ~10 seconds
npm run lint
```

## Validation

### Manual Validation Requirements
After making any changes, ALWAYS perform these validation steps:

1. **Build Validation:**
   ```bash
   # Test full build process - NEVER CANCEL, takes 45-60 seconds
   npm run build
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   
3. **Verify Homepage Loads:**
   - Navigate to http://localhost:3000
   - Confirm "Latest" heading displays
   - Verify blog posts are listed with dates and tags
   - Check navigation menu works (Blog, Tags, Projects, About)

4. **Test Blog Functionality:**
   - Click "Blog" in navigation to go to `/blog`
   - Verify pagination shows "1 of 5" and Next/Previous buttons
   - Click on a blog post title to view full post
   - Click "All Posts" link from homepage
   - Visit `/tags` to see tag listing
   - Click on a tag (e.g. "kubernetes") to test tag filtering
   - Verify tag page shows correct number of posts (e.g. "kubernetes (17)")

5. **Test Navigation:**
   - Test all main navigation links: Blog, Tags, Projects, About
   - Test mobile menu toggle (hamburger icon)
   - Test dark mode toggle button

6. **Code Quality Check:**
   ```bash
   # ALWAYS run before committing - takes 2-5 seconds
   npm run lint
   ```

### Known Network Dependencies and Workarounds

**Google Fonts Issue:**
- Build may fail with `Failed to fetch 'Space Grotesk' from Google Fonts` in restricted networks
- This is expected behavior - the application gracefully handles this failure
- If build fails due to fonts, the application will still function correctly

**Redis Connection:**
- Redis errors during build are normal if Redis server is not running
- Application gracefully falls back to Contentlayer data source
- Cache functionality will be disabled but core features work

## Common Tasks

### Blog Content Management
- Blog posts are in `data/blog/` as `.mdx` files
- Author information in `data/authors/default.mdx`
- Project data in `data/projectsData.ts`
- Navigation links in `data/headerNavLinks.ts`

### Cache System (Optional but Recommended)
```bash
# Start Redis server for full cache functionality
docker run -p 6379:6379 redis

# Test cache system (requires build first)
npm run build
npx tsx scripts/test-cache.ts

# Test Redis connection
node scripts/test-redis.js
```

### Layout and Styling
- Main layout in `app/layout.tsx`
- Components in `components/`
- Tailwind CSS configuration in `tailwind.config.js`
- Custom styles in `css/tailwind.css`

## Timing Expectations

**CRITICAL - NEVER CANCEL these operations:**

- **`npm install`**: 45-60 seconds (normal with peer dependency warnings)
- **`npm run build`**: 45-60 seconds (NEVER CANCEL - includes Contentlayer generation, may fail due to Google Fonts in restricted networks)
- **`npm run dev`**: 6-10 seconds startup
- **`npm run lint`**: 2-5 seconds
- **Contentlayer generation**: Included in build time, ~2-3 seconds
- **Redis cache operations**: 2-5 seconds when Redis is available

## Environment Variables

### Development Setup
```bash
# .env.local - Copy from .env.example
REDIS_URL=redis://localhost:6379
ENABLE_AI_MONITORING_PAGE=true
OPENAI_API_KEY=your-key-here
NEXT_PUBLIC_ENABLE_SENTRY_TEST_PAGE=false
```

### Production Considerations
- Sentry DSN and auth tokens for error monitoring
- Redis URL for cache functionality
- Cache API keys for production security
- Vercel environment variables for deployment

## Key Project Structure

```
├── app/                 # Next.js App Router pages and API routes
│   ├── layout.tsx      # Root layout with fonts and providers
│   ├── page.tsx        # Homepage
│   └── api/           # API endpoints (cache, health, monitoring)
├── components/         # React components
├── data/              # Blog content and configuration
│   ├── blog/          # MDX blog posts
│   ├── authors/       # Author profiles
│   └── siteMetadata.js # Site configuration
├── lib/               # Utility functions and services
│   ├── blogCache.ts   # Redis cache for blog posts
│   ├── cache.ts       # Generic cache service
│   └── redis.ts       # Redis client configuration
├── scripts/           # Build and utility scripts
│   ├── test-cache.ts  # Cache system testing
│   └── test-redis.js  # Redis connection testing
├── docs/              # Documentation
│   ├── CACHE_API.md   # Cache API usage
│   ├── REDIS_CACHE.md # Redis integration
│   └── SENTRY_CONFIG.md # Monitoring setup
└── contentlayer.config.js # Content management configuration
```

## Troubleshooting

### Build Failures
1. **Google Fonts Error**: 
   - Error: `Failed to fetch 'Space Grotesk' from Google Fonts`
   - Cause: Network restrictions preventing access to fonts.googleapis.com
   - Workaround: Temporarily disable fonts in `app/layout.tsx` or ensure network access
   - This is a critical dependency for production builds
2. **Contentlayer Issues**: Run `npm run build` to regenerate `.contentlayer` directory
3. **TypeScript Errors**: Run `npm run lint` to identify and fix issues
4. **Redis Errors**: Start Redis server or ignore if cache is not needed

### Development Issues
1. **Port 3000 in use**: Kill existing process or use different port
2. **Node.js version mismatch**: Ensure Node.js 22.x is active
3. **Missing dependencies**: Run `npm install` again
4. **Build cache issues**: Delete `.next` directory and rebuild

### Testing Cache Functionality
```bash
# Requires Redis server running
docker run -d -p 6379:6379 --name redis redis

# Test cache after successful build
npm run build && npx tsx scripts/test-cache.ts
```

## Important Notes for Agents

- **Portuguese Content**: Blog posts are primarily in Portuguese, focused on Cloud Native technologies
- **Graceful Degradation**: System works without Redis, Sentry, or external fonts
- **Development First**: Optimized for local development with production deployment readiness
- **Build Validation**: Always test complete user flows after making changes
- **Network Awareness**: External dependencies may fail in restricted environments - this is expected

### Expected Output Examples

**Successful npm install:**
```
added 1285 packages, and audited 1286 packages in 50s
439 packages are looking for funding
found 0 vulnerabilities
```
Note: Peer dependency warnings about React versions are normal and can be ignored.

**Successful build:**
```
✓ Compiled successfully in 11.3s
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (87/87)
RSS feed generated...
```
Note: Redis connection errors during build are normal if Redis is not running.

**Successful dev server start:**
```
✓ Ready in 6.5s
- Local:        http://localhost:3000
```

**Successful lint:**
```
✔ No ESLint warnings or errors
```

## CI/CD Integration

The repository includes:
- GitHub Actions workflow (`.github/workflows/nextjs.yml`) for static site generation
- Vercel deployment configuration (`vercel.json`)
- Security scanning with Trivy (`.github/workflows/trivy.yml`)
- ESLint and Prettier configuration for code quality

Always run `npm run lint` before committing to ensure consistency with CI pipeline.