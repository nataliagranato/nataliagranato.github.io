# Política de Segurança

## Versões Suportadas

| Versão | Suporte            |
| ------ | ------------------ |
| 1.0.0  | :white_check_mark: |

## Reportando Vulnerabilidades

Agradecemos seu interesse em ajudar a manter nosso projeto seguro. Se você descobrir uma vulnerabilidade de segurança, por favor:

1. **Não crie uma Issue pública** - Vulnerabilidades de segurança não devem ser discutidas publicamente
2. **Envie um e-mail** para [contato@nataliagranato.xyz]
3. **Inclua detalhes**:
   - Descrição clara da vulnerabilidade
   - Passos para reproduzir
   - Versão afetada
   - Possível impacto

### O que esperar

Após reportar uma vulnerabilidade:

- Confirmação de recebimento em até 48 horas
- Avaliação inicial em até 7 dias
- Atualizações regulares sobre o progresso
- Crédito adequado quando a vulnerabilidade for corrigida

## Práticas de Segurança

Este projeto segue as seguintes práticas:

- 🔒 Code Review obrigatório para todas as alterações
- 🔄 Atualizações automáticas via Dependabot
- 🛡️ Análise de código com CodeQL

## Ferramentas de Segurança

- GitHub Advanced Security
- Dependabot
- CodeQL Analysis
- Scorecard Supply-Chain Security
- Trivy
- Checkov

## Vulnerabilidades Conhecidas e Mitigações

### CVE-2024-29415: ip package SSRF vulnerability

**Status**: Mitigado  
**Data**: 2025-12-31  
**Severidade**: Alta

#### Descrição
O pacote `ip` versão 2.0.1 e anteriores possui uma vulnerabilidade de SSRF (Server-Side Request Forgery) devido à categorização incorreta de endereços IP na função `isPublic()`. IPs como `127.1`, `01200034567`, `012.1.2.3`, `000:0:0000::01` e `::fFFf:127.0.0.1` são incorretamente categorizados como publicamente roteáveis.

Esta vulnerabilidade existe devido a uma correção incompleta da CVE-2023-42282.

#### Mitigação
Removida a resolução forçada do pacote `ip@2.0.1` do `package.json`. O pacote `ip` não é usado diretamente neste projeto, sendo apenas uma dependência transitiva. Como não há versão corrigida disponível (first_patched_version: null), a remoção da resolução permite que as dependências gerenciem suas próprias versões do pacote. Isso significa que o pacote `ip` ainda pode estar presente na árvore de dependências por meio de outras bibliotecas, porém em versões determinadas pelos requisitos dessas dependências, potencialmente diferentes (e possivelmente mais seguras) do que a versão explicitamente fixada anteriormente.

#### Referências
- [GHSA-2p57-rm9w-gvfp](https://github.com/advisories/GHSA-2p57-rm9w-gvfp)
- [CVE-2024-29415](https://nvd.nist.gov/vuln/detail/CVE-2024-29415)
