const { criarApp } = require('./app');
const port = process.env.PORT || 3000;
criarApp().listen(port, () => console.log(`Rodando em http://localhost:${port}`));
