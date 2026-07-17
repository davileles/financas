import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '2mb' }));

// Lista de origens autorizadas a chamar este proxy (separadas por vírgula).
// Ex.: https://davileles.github.io ou https://financas.seudominio.com.br
// Deixe vazio para permitir qualquer origem (não recomendado em produção).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(function (s) { return s.trim(); })
  .filter(Boolean);

app.use(cors({
  origin: function (origin, cb) {
    // requisições sem "origin" (ex.: curl, health checks) são liberadas
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      return cb(null, true);
    }
    cb(new Error('Origem não permitida: ' + origin));
  }
}));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const PROXY_SHARED_SECRET = process.env.PROXY_SHARED_SECRET || '';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS_LIMIT = 16000;

app.get('/', function (req, res) {
  res.json({ ok: true, service: 'financas-ai-proxy' });
});

app.get('/health', function (req, res) {
  res.json({ ok: true, hasKey: !!ANTHROPIC_API_KEY });
});

// Endpoint chamado pelo app Finanças da Família para interpretar faturas.
// Recebe o mesmo formato do endpoint /v1/messages da Anthropic
// ({ model, max_tokens, messages }) e repassa para a Anthropic injetando
// a chave no servidor — assim a chave nunca aparece no navegador do usuário.
app.post('/api/interpretar-fatura', async function (req, res) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' });
    }
    if (PROXY_SHARED_SECRET) {
      var key = req.get('x-proxy-key') || '';
      if (key !== PROXY_SHARED_SECRET) {
        return res.status(401).json({ error: 'Não autorizado. Verifique a chave do proxy configurada no app.' });
      }
    }

    var body = req.body || {};
    var messages = body.messages;
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: '"messages" é obrigatório.' });
    }

    var maxTokens = Math.min(Number(body.max_tokens) || 4096, MAX_TOKENS_LIMIT);

    var r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: body.model || 'claude-haiku-4-5',
        max_tokens: maxTokens,
        messages: messages
      })
    });

    var data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    res.json(data);
  } catch (err) {
    console.error('Erro no proxy:', err);
    res.status(500).json({ error: 'Falha no proxy: ' + err.message });
  }
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('financas-ai-proxy ouvindo na porta ' + PORT);
});
