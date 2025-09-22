# Documentação de Monitoramento

Este documento descreve os endpoints e headers de monitoramento implementados para `https://www.nataliagranato.xyz/`.

## Headers de Monitoramento

Todos os requests para o site incluem os seguintes headers de monitoramento:

### Headers Principais
- **X-Header-Value**: `monitoring-active` (indica que o monitoramento está ativo)
- **Header-Value**: `nataliagranato-xyz-health-check` (identificador específico do site)

### Headers Adicionais
- **X-Server-Status**: `online` (status do servidor)
- **X-Environment**: `production` ou `development` (ambiente atual)
- **X-Request-ID**: ID único para cada requisição
- **X-Response-Time**: Tempo de resposta em millisegundos

## Endpoints de Monitoramento

### 1. Health Check Básico
```
GET https://www.nataliagranato.xyz/api/health
```

**Resposta de Sucesso:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-22T10:30:00.000Z",
  "uptime": 123456,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "server": "ok",
    "memory": {
      "rss": "45MB",
      "heapTotal": "25MB",
      "heapUsed": "15MB",
      "external": "5MB"
    },
    "responseTime": "25ms"
  }
}
```

**Headers de Resposta:**
- `X-Header-Value: monitoring-active`
- `Header-Value: nataliagranato-xyz-health-check`
- `X-Health-Status: healthy`
- `X-Response-Time: 25ms`

### 2. Monitoramento Avançado
```
GET https://www.nataliagranato.xyz/api/monitoring
```

**Parâmetros de Query:**
- `type=basic` (padrão) - Monitoramento básico
- `type=detailed` - Informações detalhadas do sistema
- `type=performance` - Métricas de performance

**Exemplo de Uso:**
```bash
# Monitoramento básico
curl -H "Accept: application/json" https://www.nataliagranato.xyz/api/monitoring

# Monitoramento detalhado
curl -H "Accept: application/json" https://www.nataliagranato.xyz/api/monitoring?type=detailed

# Métricas de performance
curl -H "Accept: application/json" https://www.nataliagranato.xyz/api/monitoring?type=performance
```

**Headers de Resposta Específicos:**
- `X-Header-Value: monitoring-active`
- `Header-Value: nataliagranato-xyz-monitoring`
- `X-Monitor-Type: [basic|detailed|performance]`
- `X-Monitor-Status: [success|error]`

## Configuração de Alertas

Para configurar alertas externos que fazem GET para o site:

### 1. Configuração Básica
- **URL**: `https://www.nataliagranato.xyz/`
- **X-Header-Value**: `monitoring-active`
- **Header-Value**: `nataliagranato-xyz-health-check`

### 2. Configuração para Health Check
- **URL**: `https://www.nataliagranato.xyz/api/health`
- **X-Header-Value**: `monitoring-active`
- **Header-Value**: `nataliagranato-xyz-health-check`
- **Status Code Esperado**: `200`
- **Response JSON**: `status: "healthy"`

### 3. Configuração para Monitoramento Avançado
- **URL**: `https://www.nataliagranato.xyz/api/monitoring`
- **X-Header-Value**: `monitoring-active`
- **Header-Value**: `nataliagranato-xyz-monitoring`
- **Status Code Esperado**: `200`
- **Response JSON**: `status: "healthy"`

## Exemplos de Implementação

### cURL
```bash
# Verificação simples
curl -i https://www.nataliagranato.xyz/

# Health check
curl -i -H "Accept: application/json" https://www.nataliagranato.xyz/api/health

# Monitoramento com headers específicos
curl -i \
  -H "Accept: application/json" \
  -H "User-Agent: MonitoringBot/1.0" \
  https://www.nataliagranato.xyz/api/monitoring
```

### JavaScript/Node.js
```javascript
const response = await fetch('https://www.nataliagranato.xyz/api/health', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'MonitoringBot/1.0'
  }
});

const data = await response.json();
const headerValue = response.headers.get('X-Header-Value');
const healthStatus = response.headers.get('X-Health-Status');

console.log('Health:', data.status);
console.log('Headers:', { headerValue, healthStatus });
```

### Python
```python
import requests

response = requests.get('https://www.nataliagranato.xyz/api/health')

print(f"Status: {response.json()['status']}")
print(f"X-Header-Value: {response.headers.get('X-Header-Value')}")
print(f"Header-Value: {response.headers.get('Header-Value')}")
```

## Códigos de Status

- **200**: Serviço saudável
- **500**: Erro interno do servidor
- **503**: Serviço indisponível

## Troubleshooting

### Headers Não Aparecem
- Verifique se o middleware está ativo
- Confirme que a requisição está chegando ao servidor

### Endpoint Não Responde
- Verifique se a URL está correta
- Confirme que não há bloqueios de firewall
- Teste com diferentes tipos de monitoramento (`?type=basic`)

### Performance Issues
- Use `type=basic` para checks mais rápidos
- Implemente cache se necessário
- Monitore os logs do Sentry para erros