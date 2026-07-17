# financas-ai-proxy

Proxy mínimo em Node/Express para o app **Finanças da Família**. Ele existe por um único motivo:
chamar a API da Anthropic direto do navegador exporia a chave publicamente (o app fica hospedado
no GitHub Pages, então o código-fonte é 100% visível). Este proxy fica rodando no Railway,
guarda a chave como variável de ambiente e repassa a chamada.

## O que ele faz

- Expõe `POST /api/interpretar-fatura`, recebendo o mesmo formato do endpoint
  `/v1/messages` da Anthropic: `{ model, max_tokens, messages }`.
- Injeta o header `x-api-key` com a `ANTHROPIC_API_KEY` (variável de ambiente do servidor).
- Repassa a resposta da Anthropic sem modificar o formato — o app já sabe interpretar
  `data.content[].text`.
- Protege o endpoint com um segredo compartilhado (`PROXY_SHARED_SECRET`), enviado pelo
  app no header `x-proxy-key`, e opcionalmente restringe por origem (CORS).

## Deploy no Railway (mesmo padrão do `baileys-server`/`cdv-proxy`)

1. No Railway, **New Project → Deploy from GitHub repo** e selecione `davileles/financas`.
2. Em **Settings → Root Directory**, defina `proxy` (a raiz deste serviço é esta pasta).
3. Em **Variables**, adicione:
   - `ANTHROPIC_API_KEY` — sua chave em [console.anthropic.com](https://console.anthropic.com)
   - `PROXY_SHARED_SECRET` — uma string aleatória longa (ex.: `openssl rand -hex 24`)
   - `ALLOWED_ORIGINS` — a URL do GitHub Pages do app, ex.:
     `https://davileles.github.io`
4. Deploy. O Railway vai gerar um domínio público, ex.:
   `https://financas-ai-proxy-production.up.railway.app`.
5. No app (aba **Nuvem → Interpretação por IA**), preencha:
   - **Endpoint do proxy de IA**: `https://SEU-DOMINIO.up.railway.app/api/interpretar-fatura`
   - **Chave do proxy**: o mesmo valor de `PROXY_SHARED_SECRET`

## Rodando localmente (opcional, para testar)

```bash
cd proxy
cp .env.example .env   # preencha ANTHROPIC_API_KEY e PROXY_SHARED_SECRET
npm install
npm start
```

Teste com:

```bash
curl -X POST http://localhost:3000/api/interpretar-fatura \
  -H "Content-Type: application/json" \
  -H "x-proxy-key: SEU_PROXY_SHARED_SECRET" \
  -d '{"messages":[{"role":"user","content":"Responda apenas: ok"}],"max_tokens":32}'
```

## Segurança

- A `ANTHROPIC_API_KEY` só existe nas variáveis de ambiente do Railway — nunca no
  repositório nem no navegador.
- `PROXY_SHARED_SECRET` evita que estranhos usem seu endpoint público para consumir
  seus créditos da Anthropic. Trate-o como uma senha.
- `ALLOWED_ORIGINS` é uma segunda camada (CORS) — reforça, mas não substitui, o
  segredo compartilhado.
