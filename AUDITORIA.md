# AUDITORIA.md — Gerenciador de Tarefas

Auditoria somente leitura (Prompt 4), feita em 02/11/2026 sobre a versão inicial do código.
Nada foi alterado durante a auditoria. Itens que não deu para conferir estão marcados como **não verificado**.

## Os 5 achados de maior risco (em ordem)

| # | Achado | Risco | Arquivo:linha |
|---|--------|-------|---------------|
| 1 | Não há login: quem tiver a URL lê, edita e apaga todas as tarefas | Alto (em uso real) | app.js:63-103 |
| 2 | Corpo maior que 10 KB devolve erro 500 genérico em vez de 413 | Médio | app.js:56 e 105 |
| 3 | Sem limite de requisições (rate limit): a API pública pode ser inundada | Médio | app.js:56-61 |
| 4 | SQLite em disco efêmero (Render Free) pode perder dados ao reiniciar | Médio | app.js:11 |
| 5 | Clicar 2 vezes em "Adicionar tarefa" cria tarefas duplicadas | Baixo | public/index.html:112-118 |

## Etapa 1 — Testes de integração

| Achado | Risco | Arquivo:linha | Correção sugerida |
|--------|-------|---------------|-------------------|
| Ferramenta de teste configurada: `node:test` nativo; comando único `npm test`; banco de teste em memória (`:memory:`), separado do real. Resultado: 6 passam, 0 falham | — | test/api.test.js | Manter |
| Todas as rotas CRUD têm teste batendo na rota de verdade. Não há cadastro/login/pagamento/webhook neste sistema | — | test/api.test.js | — |
| Faltavam testes: PUT em id inexistente, filtro com status inválido, descrição > 500 caracteres, corpo grande, 2 requisições simultâneas | Baixo | test/api.test.js | Adicionar (feito no Prompt 3) |

## Etapa 2 — Confiança no cliente

| Achado | Risco | Arquivo:linha | Correção sugerida |
|--------|-------|---------------|-------------------|
| Regras de preço, desconto, permissão, admin ou plano: **não existem** neste sistema | — | — | — |
| Validação (título, prioridade, prazo, status) é refeita no servidor; o `maxlength` do HTML é só conveniência | Baixo (ok) | app.js:23-52 | Manter |
| Chaves/tokens no front ou em variáveis públicas: **nenhuma** encontrada. `.env` está no `.gitignore`; `.env.example` não tem segredo | — | .gitignore, .env.example | — |
| Supabase / RLS: **não se aplica** (SQLite local, sem API de banco exposta ao navegador) | — | — | — |
| Sem autenticação nem donos de tarefa: todos os dados são de todos | Alto (uso real) | app.js:63-103 | Para a atividade: documentar a limitação e não guardar dados sensíveis. Em produção: login e coluna `usuario_id` |
| SQL usa parâmetros (`?`), então não há injeção de SQL. A tela usa `textContent`, então não há XSS | Baixo (ok) | app.js, index.html | Manter |

## Etapa 3 — Race condition

| Achado | Risco | Arquivo:linha | Correção sugerida |
|--------|-------|---------------|-------------------|
| Não há recurso limitado (estoque, cupom, saldo, vaga) | — | — | — |
| PUT lê a tarefa, mescla e grava (ler-decidir-gravar). `node:sqlite` é síncrono e roda em um único processo, então duas requisições não se intercalam. Com vários processos poderia haver "última gravação vence" | Baixo | app.js:87-96 | Se escalar para vários processos, usar `UPDATE` com `WHERE` e versão |
| Nenhuma proteção depende de lock em memória, Redis ou cache | — | — | — |

## Etapa 4 — Idempotência

| Achado | Risco | Arquivo:linha | Correção sugerida |
|--------|-------|---------------|-------------------|
| Não há webhooks nem gateway de pagamento | — | — | — |
| POST não é idempotente: duplo clique cria 2 tarefas iguais | Baixo | public/index.html:112-118 | Desabilitar o botão durante o envio (feito no Prompt 1) |

## Etapa 5 — Separação de responsabilidades

| Achado | Risco | Arquivo:linha | Correção sugerida |
|--------|-------|---------------|-------------------|
| `app.js` (111 linhas) mistura validação, acesso ao banco e rotas. É o candidato nº 1 a refatorar | Baixo | app.js | Extrair a validação para `src/validacao.js` (feito no Prompt 2) |
| `public/index.html` (128 linhas) mistura tela, chamadas à API e estado | Baixo | public/index.html | Aceitável neste tamanho |

## Não verificado
- Comportamento do sistema publicado (deploy ainda não existia na hora da auditoria).
- Persistência real do disco no Render Free (depende do plano contratado).

## Qual prompt rodar primeiro
O **Prompt 1 (segurança)**, porque os achados 1 a 3 são de segurança e disponibilidade. Em seguida o Prompt 3 (testes), para cobrir as lacunas, e por último o Prompt 2 (refatoração).

---

# Correções aplicadas depois da auditoria

**Prompt 1 — Segurança**
- Achado 2: o tratamento de erro agora devolve **413** para corpo grande, em vez de 500.
- Achado 5: o botão "Adicionar/Salvar" fica desabilitado durante o envio (evita duplo clique).
- Achados 1, 3 e 4 foram **documentados e não corrigidos**: exigem login, biblioteca de rate limit e banco externo, que ficam fora do escopo de um sistema simples. Decisão do aluno: aceitar o risco para esta atividade.

**Prompt 3 — Testes**
- Foram adicionados 5 testes (PUT 404, filtro inválido, descrição longa, corpo grande → 413, duas criações simultâneas). Total: 11 testes.
- Nenhum teste foi apagado, pulado ou afrouxado.

**Prompt 2 — Refatoração**
- A validação saiu de `app.js` para `src/validacao.js`, sem mudar rotas, nomes públicos nem comportamento. Os testes rodaram antes e depois.
- Bug anotado fora da refatoração: nenhum encontrado.
