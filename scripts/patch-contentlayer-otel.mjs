import { readFileSync, writeFileSync } from 'node:fs'

// @contentlayer2/utils always imports its optional Jaeger tracer.
// OpenTelemetry 2.x removed the Resource class; the site does not set CL_OTEL,
// but the import still has to resolve or Contentlayer fails to load.
const target = new URL(
  '../node_modules/@contentlayer2/utils/dist/tracing-effect/index.js',
  import.meta.url
)

const source = readFileSync(target, 'utf8')
const patched = source
  .replace(
    "import { Resource } from '@opentelemetry/resources';",
    "import { resourceFromAttributes } from '@opentelemetry/resources';"
  )
  .replace(
    'resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName }),',
    'resource: resourceFromAttributes({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName }),'
  )

if (patched === source) {
  if (source.includes('resourceFromAttributes')) {
    process.exit(0)
  }
  console.error('patch-contentlayer-otel: padrão do Contentlayer não encontrado')
  process.exit(1)
}

writeFileSync(target, patched)
