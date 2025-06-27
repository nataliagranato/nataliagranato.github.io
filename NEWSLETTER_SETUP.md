# Configuração do Newsletter - STATUS: ✅ FUNCIONANDO

O newsletter está **completamente configurado e funcionando** com Buttondown.

## Status Atual ✅

- **Provedor**: Buttondown
- **API**: `/api/newsletter` (customizada)
- **Componente**: Formulário na página inicial
- **Status**: Totalmente funcional

## Configuração Ativa

### Variáveis de Ambiente (`.env.local`)
```bash
BUTTONDOWN_API_KEY=YOUR_BUTTONDOWN_API_KEY
# Substitua `YOUR_BUTTONDOWN_API_KEY` pelo seu próprio valor no arquivo `.env.local`.
```

### Configuração do Site (`data/siteMetadata.js`)
```javascript
newsletter: {
  provider: 'buttondown',
},
```

## Funcionalidades Implementadas

- [x] Inscrição de novos emails
- [x] Validação de formato de email
- [x] Detecção de emails duplicados
- [x] Mensagens de erro em português
- [x] Confirmação de sucesso
- [x] Interface responsiva
- [x] **Métricas e Analytics** 📊
  - [x] Dashboard de métricas em `/newsletter/metrics`
  - [x] Contador de inscritos na página inicial
  - [x] API de estatísticas `/api/newsletter/stats`
  - [x] Contador rápido `/api/newsletter/count`
  - [x] Métricas de crescimento mensal
  - [x] Distribuição por tags

## Endpoints da API

### Métricas Básicas
```bash
GET /api/newsletter
```
Retorna métricas básicas: total de inscritos, ativos, pendentes, crescimento dos últimos 30 dias.

### Estatísticas Avançadas
```bash
GET /api/newsletter/stats
```
Retorna estatísticas detalhadas: emails enviados, crescimento mensal, saúde da newsletter.

### Contador Rápido
```bash
GET /api/newsletter/count
```
Retorna apenas o número total de inscritos (endpoint otimizado para uso em componentes).

### Inscrição
```bash
POST /api/newsletter
Content-Type: application/json
{"email": "exemplo@email.com"}
```

## Teste da API

```bash
# Teste básico
curl -X GET http://localhost:3000/api/newsletter

# Teste de inscrição
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com"}'
```

---

## Configuração Original para Outros Provedores

## Buttondown (Recomendado para começar)

1. Crie uma conta em [buttondown.email](https://buttondown.email)
2. Vá em Settings → Programming
3. Copie sua API Key
4. No arquivo `.env.local`, adicione:
   ```
   BUTTONDOWN_API_KEY=sua_api_key_aqui
   ```

## Mailchimp

1. Crie uma conta no Mailchimp
2. Obtenha sua API Key e Server Prefix
3. Crie uma audience e obtenha o ID
4. Configure no `.env.local`:
   ```
   MAILCHIMP_API_KEY=sua_api_key
   MAILCHIMP_API_SERVER=us1 # ou seu server prefix
   MAILCHIMP_AUDIENCE_ID=seu_audience_id
   ```
5. Altere o provider em `data/siteMetadata.js`:
   ```javascript
   newsletter: {
     provider: 'mailchimp',
   }
   ```

## ConvertKit

1. Crie uma conta no ConvertKit
2. Obtenha sua API Key
3. Crie um formulário e obtenha o ID
4. Configure no `.env.local`:
   ```
   CONVERTKIT_API_KEY=sua_api_key
   CONVERTKIT_FORM_ID=seu_form_id
   ```
5. Altere o provider em `data/siteMetadata.js`:
   ```javascript
   newsletter: {
     provider: 'convertkit',
   }
   ```

## EmailOctopus

1. Crie uma conta no EmailOctopus
2. Obtenha sua API Key
3. Crie uma lista e obtenha o ID
4. Configure no `.env.local`:
   ```
   EMAILOCTOPUS_API_KEY=sua_api_key
   EMAILOCTOPUS_LIST_ID=seu_list_id
   ```
5. Altere o provider em `data/siteMetadata.js`:
   ```javascript
   newsletter: {
     provider: 'emailoctopus',
   }
   ```

## Testando a Configuração

1. Após configurar as variáveis de ambiente, reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Vá para a página inicial do seu site
3. Role até o final onde está o formulário de newsletter
4. Teste inserindo um email válido

Se tudo estiver configurado corretamente, você não deve receber mais erros 401, e os emails devem ser adicionados à sua lista no provedor escolhido.

## Solução de Problemas

- **Erro 401**: API Key incorreta ou não configurada
- **Erro 404**: Provider não suportado ou mal configurado
- **Formulário não aparece**: Verifique se `siteMetadata.newsletter.provider` está definido
