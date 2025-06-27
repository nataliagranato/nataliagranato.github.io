// Custom loader para contornar problemas do Contentlayer
export async function resolve(specifier, context, defaultResolve) {
  // Ignorar problemas com 'assert' no Contentlayer
  if (specifier === 'assert' && context.parentURL?.includes('contentlayer')) {
    return {
      url: 'data:text/javascript,export default {}',
      shortCircuit: true
    }
  }
  
  return defaultResolve(specifier, context)
}
