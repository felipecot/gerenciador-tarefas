const PRIORIDADES = ['baixa', 'media', 'alta'];
const STATUS = ['pendente', 'concluida'];

// Toda validação acontece aqui, no servidor (o front só ajuda a experiência).
function validar(body, parcial = false) {
  const erros = [];
  const d = {};
  if (!parcial || body.titulo !== undefined) {
    const t = typeof body.titulo === 'string' ? body.titulo.trim() : '';
    if (!t) erros.push('O título é obrigatório.');
    else if (t.length > 100) erros.push('O título deve ter no máximo 100 caracteres.');
    else d.titulo = t;
  }
  if (body.descricao !== undefined) {
    const x = typeof body.descricao === 'string' ? body.descricao.trim() : null;
    if (x === null || x.length > 500) erros.push('A descrição deve ser um texto de até 500 caracteres.');
    else d.descricao = x;
  }
  if (body.prioridade !== undefined) {
    if (!PRIORIDADES.includes(body.prioridade)) erros.push('Prioridade inválida (use baixa, media ou alta).');
    else d.prioridade = body.prioridade;
  }
  if (body.status !== undefined) {
    if (!STATUS.includes(body.status)) erros.push('Status inválido (use pendente ou concluida).');
    else d.status = body.status;
  }
  if (body.prazo !== undefined && body.prazo !== null && body.prazo !== '') {
    const ok = typeof body.prazo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.prazo) &&
      !Number.isNaN(Date.parse(body.prazo));
    if (!ok) erros.push('Prazo inválido (use o formato AAAA-MM-DD).');
    else d.prazo = body.prazo;
  } else if (body.prazo === null || body.prazo === '') d.prazo = null;
  return { erros, dados: d };
}

module.exports = { validar, STATUS, PRIORIDADES };
