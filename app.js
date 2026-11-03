const express = require('express');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const { validar, STATUS } = require('./src/validacao');

function criarApp(dbPath = process.env.DB_PATH || './data/tarefas.db') {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    prioridade TEXT NOT NULL DEFAULT 'media',
    prazo TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/tarefas', (req, res) => {
    const { status } = req.query;
    if (status && !STATUS.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });
    const rows = status
      ? db.prepare('SELECT * FROM tarefas WHERE status = ? ORDER BY id DESC').all(status)
      : db.prepare('SELECT * FROM tarefas ORDER BY id DESC').all();
    res.json(rows);
  });

  app.get('/api/tarefas/:id', (req, res) => {
    const t = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(req.params.id);
    if (!t) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    res.json(t);
  });

  app.post('/api/tarefas', (req, res) => {
    const { erros, dados } = validar(req.body || {});
    if (erros.length) return res.status(400).json({ erro: erros.join(' ') });
    const info = db.prepare(
      'INSERT INTO tarefas (titulo, descricao, prioridade, prazo, status) VALUES (?, ?, ?, ?, ?)'
    ).run(dados.titulo, dados.descricao ?? '', dados.prioridade ?? 'media', dados.prazo ?? null, 'pendente');
    res.status(201).json(db.prepare('SELECT * FROM tarefas WHERE id = ?').get(info.lastInsertRowid));
  });

  app.put('/api/tarefas/:id', (req, res) => {
    const atual = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    const { erros, dados } = validar(req.body || {}, true);
    if (erros.length) return res.status(400).json({ erro: erros.join(' ') });
    const n = { ...atual, ...dados };
    db.prepare('UPDATE tarefas SET titulo=?, descricao=?, prioridade=?, prazo=?, status=? WHERE id=?')
      .run(n.titulo, n.descricao, n.prioridade, n.prazo, n.status, atual.id);
    res.json(db.prepare('SELECT * FROM tarefas WHERE id = ?').get(atual.id));
  });

  app.delete('/api/tarefas/:id', (req, res) => {
    const info = db.prepare('DELETE FROM tarefas WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    res.status(204).end();
  });

  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'Dados grandes demais.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  });
  return app;
}

module.exports = { criarApp };
