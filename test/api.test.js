const test = require('node:test');
const assert = require('node:assert');
const { criarApp } = require('../app');

let server, base;
test.before(async () => {
  // Banco de testes em memória: nunca toca em dados reais.
  server = criarApp(':memory:').listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/tarefas`;
});
test.after(() => server.close());

const enviar = (url, metodo, corpo) =>
  fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: corpo && JSON.stringify(corpo) });

test('cria tarefa válida (caminho feliz)', async () => {
  const r = await enviar(base, 'POST', { titulo: 'Estudar', prioridade: 'alta', prazo: '2026-12-01' });
  assert.strictEqual(r.status, 201);
  const t = await r.json();
  assert.strictEqual(t.status, 'pendente');
  assert.strictEqual(t.prioridade, 'alta');
});

test('rejeita título vazio', async () => {
  const r = await enviar(base, 'POST', { titulo: '   ' });
  assert.strictEqual(r.status, 400);
  assert.match((await r.json()).erro, /título/i);
});

test('rejeita prioridade, prazo e título longo inválidos', async () => {
  assert.strictEqual((await enviar(base, 'POST', { titulo: 'a', prioridade: 'urgente' })).status, 400);
  assert.strictEqual((await enviar(base, 'POST', { titulo: 'a', prazo: '31/02/2026' })).status, 400);
  assert.strictEqual((await enviar(base, 'POST', { titulo: 'x'.repeat(101) })).status, 400);
});

test('lista, consulta, edita e conclui', async () => {
  const { id } = await (await enviar(base, 'POST', { titulo: 'Lavar louça' })).json();
  assert.ok((await (await fetch(base)).json()).some(t => t.id === id));
  assert.strictEqual((await fetch(`${base}/${id}`)).status, 200);
  const e = await (await enviar(`${base}/${id}`, 'PUT', { titulo: 'Lavar a louça', status: 'concluida' })).json();
  assert.strictEqual(e.titulo, 'Lavar a louça');
  assert.strictEqual(e.status, 'concluida');
  const filtradas = await (await fetch(`${base}?status=concluida`)).json();
  assert.ok(filtradas.every(t => t.status === 'concluida'));
});

test('exclui e depois retorna 404', async () => {
  const { id } = await (await enviar(base, 'POST', { titulo: 'Apagar' })).json();
  assert.strictEqual((await fetch(`${base}/${id}`, { method: 'DELETE' })).status, 204);
  assert.strictEqual((await fetch(`${base}/${id}`)).status, 404);
  assert.strictEqual((await fetch(`${base}/${id}`, { method: 'DELETE' })).status, 404);
});

test('rejeita status inválido e JSON quebrado', async () => {
  const { id } = await (await enviar(base, 'POST', { titulo: 'Teste' })).json();
  assert.strictEqual((await enviar(`${base}/${id}`, 'PUT', { status: 'feito' })).status, 400);
  const r = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{quebrado' });
  assert.strictEqual(r.status, 400);
});

test('PUT em id inexistente retorna 404', async () => {
  assert.strictEqual((await enviar(`${base}/999999`, 'PUT', { titulo: 'x' })).status, 404);
});

test('filtro com status inválido retorna 400', async () => {
  assert.strictEqual((await fetch(`${base}?status=qualquer`)).status, 400);
});

test('rejeita descrição maior que 500 caracteres', async () => {
  assert.strictEqual((await enviar(base, 'POST', { titulo: 'a', descricao: 'x'.repeat(501) })).status, 400);
});

test('corpo maior que 10 KB retorna 413', async () => {
  assert.strictEqual((await enviar(base, 'POST', { titulo: 'a', descricao: 'x'.repeat(20000) })).status, 413);
});

test('duas criações simultâneas geram 2 tarefas distintas', async () => {
  const [a, b] = await Promise.all([enviar(base, 'POST', { titulo: 'Simultânea' }), enviar(base, 'POST', { titulo: 'Simultânea' })]);
  assert.strictEqual(a.status, 201);
  assert.strictEqual(b.status, 201);
  assert.notStrictEqual((await a.json()).id, (await b.json()).id);
});
