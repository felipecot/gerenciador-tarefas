# Gerenciador de Tarefas

Sistema web simples para cadastrar, consultar, editar, concluir e excluir tarefas (CRUD), desenvolvido com apoio de IA.

**🔗 Sistema publicado:** _COLE AQUI A URL DO DEPLOY_

**Ferramenta de IA utilizada:** Claude (Anthropic)

## Funcionalidades
- Cadastrar tarefa com título, descrição, prioridade (baixa/média/alta) e prazo
- Listar, filtrar (todas/pendentes/concluídas), editar, concluir/reabrir e excluir
- Validação no servidor (título obrigatório até 100 caracteres, prioridade/status/prazo válidos)
- Mensagens de sucesso e erro; layout responsivo (computador e celular)

## Tecnologias
Node.js (22.13 ou superior), Express, SQLite (módulo nativo `node:sqlite`), HTML/CSS/JavaScript puro.
**Persistência:** SQLite foi escolhido por ser um arquivo simples, sem servidor separado e sem custo. Em hospedagem gratuita com disco efêmero (ex.: Render Free), os dados podem ser apagados ao reiniciar; para dados importantes use disco persistente ou banco gerenciado.

## Como executar
```bash
npm install
npm start          # http://localhost:3000
```
Copie `.env.example` para `.env` se quiser mudar `PORT` ou `DB_PATH` (não há segredos).

## Testes
```bash
npm test
```
Os testes chamam a API de verdade, com banco SQLite **em memória** (separado do banco real). Cobrem: caminho feliz, campos inválidos, edição, filtro, exclusão, 404 e JSON malformado.

## API
`GET/POST /api/tarefas` · `GET/PUT/DELETE /api/tarefas/:id` · `GET /api/tarefas?status=pendente|concluida`

## Resultados dos prompts de auditoria
Relatório completo em [AUDITORIA.md](AUDITORIA.md).

| Prompt | Resultado | Decisão |
|--------|-----------|---------|
| 4 — Auditoria completa | 5 principais riscos: sem login, erro 500 em vez de 413, sem rate limit, SQLite efêmero, duplo clique | Corrigir 413 e duplo clique; documentar o resto |
| 1 — Segurança | Sem segredos, sem regras só no front, sem RLS (não usa Supabase); SQL parametrizado e tela sem XSS | Corrigido o 413 e desabilitado o botão no envio |
| 3 — Testes | De 6 para 11 testes, incluindo corpo grande, id inexistente e criação simultânea | Nenhum teste removido ou enfraquecido |
| 2 — Refatoração | Validação movida para `src/validacao.js` sem mudar comportamento | Testes passaram antes e depois |

## O que a IA fez, o que precisou corrigir e o que aprendi
_Escreva aqui, com suas palavras (3 a 5 linhas). Exemplo de pontos: a primeira versão usava uma biblioteca que não instalou no meu Windows e foi trocada pelo SQLite do Node; a auditoria achou erro 500 para corpo grande; aprendi por que a validação precisa ficar no servidor._
