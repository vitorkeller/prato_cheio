import express from 'express';
import * as doacoes from './doacoes.js';
 
// Toda rota da API responde erro do mesmo jeito: 400 com { erro: mensagem }.
// Antes, cada rota repetia o try/catch; agora o padrão mora em um lugar só.
function comTratamento(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  };
}
 
export function criarApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));
 
  // Verificação de saúde: usada pelo CI para provar que a aplicação sobe.
  app.get('/api/saude', (req, res) => res.json({ ok: true }));
 
  app.get('/api/doacoes', comTratamento(async (req, res) => {
    res.json(await doacoes.listarDisponiveis());
  }));
 
  app.post('/api/doacoes', comTratamento(async (req, res) => {
    res.status(201).json(await doacoes.criarDoacao(req.body));
  }));
 
  app.post('/api/doacoes/:id/aceitar', comTratamento(async (req, res) => {
    res.json(await doacoes.aceitar(req.params.id, req.body?.ong ?? 'ONG'));
  }));
 
  return app;
}