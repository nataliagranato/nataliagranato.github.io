/**
 * Smoke de leitura: páginas públicas, assets e health check.
 *
 * Só faz GET, então pode rodar contra produção (é monitoração, não carga).
 *
 *   k6 run tests/k6/smoke.js -e K6_BASE_URL=https://nataliagranato.xyz
 *   k6 run tests/k6/smoke.js -e K6_BASE_URL=http://127.0.0.1:3000 -e K6_VUS=1 -e K6_DURATION=5s
 *
 * Thresholds (SLO): p95 < 800ms, p99 < 1500ms, menos de 1% de falhas.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { baseUrl, positiveInt, requestParams } from './lib/config.js'

const BASE_URL = baseUrl()
const VUS = positiveInt(__ENV.K6_VUS, 2)
const DURATION = __ENV.K6_DURATION || '15s'

// 301/304 aparecem em redirects e cache do CDN; 200 é o esperado.
http.setResponseCallback(http.expectedStatuses(200, 301, 304))

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{name:health}': ['p(95)<500'],
    'http_req_duration{name:home}': ['p(95)<1000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
}

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/blog', name: 'blog' },
  { path: '/tags', name: 'tags' },
  { path: '/about', name: 'about' },
  { path: '/projects', name: 'projects' },
  { path: '/feed.xml', name: 'feed' },
  { path: '/sitemap.xml', name: 'sitemap' },
  { path: '/robots.txt', name: 'robots' },
]

export default function () {
  for (const page of PAGES) {
    const res = http.get(`${BASE_URL}${page.path}`, requestParams({ name: page.name }))
    check(res, {
      [`${page.name}: status 200`]: (r) => r.status === 200,
      [`${page.name}: corpo não vazio`]: (r) => typeof r.body === 'string' && r.body.length > 200,
    })
  }

  const health = http.get(`${BASE_URL}/api/health`, requestParams({ name: 'health' }))
  check(health, {
    'health: status 200': (r) => r.status === 200,
    'health: header X-Health-Status': (r) => r.headers['X-Health-Status'] === 'healthy',
    'health: corpo healthy': (r) => {
      try {
        return JSON.parse(r.body).status === 'healthy'
      } catch {
        return false
      }
    },
  })

  sleep(1)
}
