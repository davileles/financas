# Finanças da Família — Davi & Ágda

Aplicação web de página única (SPA) para gestão de finanças familiares: cartões de crédito,
despesas e receitas (pessoais, familiares e empresariais), importação de faturas via texto ou
PDF com interpretação por IA, projeção do comprometimento de faturas futuras por compras
parceladas, e sincronização entre dispositivos via GitHub.

## Estrutura

- **`index.html`** — o app completo (HTML + CSS + JS vanilla, sem build step). Hospedado no
  GitHub Pages.
- **`proxy/`** — pequeno servidor Node/Express, hospedado no Railway, que repassa as chamadas de
  interpretação de fatura para a API da Anthropic sem expor a chave no navegador. Veja
  [`proxy/README.md`](proxy/README.md) para instruções de deploy.
- **`financas-dados.json`** — arquivo de dados sincronizado pelo app via API do GitHub (criado
  automaticamente no primeiro "Salvar na nuvem agora"; não precisa ser criado manualmente).

## Publicando o app no GitHub Pages

1. **Settings → Pages → Source**: `Deploy from a branch`, branch `main`, pasta `/ (root)`.
2. O app fica disponível em `https://davileles.github.io/financas/`.

## Configuração inicial do app

Ao abrir o app pela primeira vez, vá em **Cadastros** para cadastrar cartões e, na aba
**Nuvem**, configure:

1. **GitHub**: usuário, repositório (`financas`), branch (`main`), arquivo
   (`financas-dados.json`) e um token fine-grained com permissão *Contents: Read and write*
   neste repositório — criado em
   [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new).
2. **Interpretação por IA**: depois de fazer o deploy do proxy (veja `proxy/README.md`),
   preencha o endpoint (`.../api/interpretar-fatura`) e a chave do proxy.

Os dados também ficam salvos localmente (`localStorage`) mesmo sem configurar a nuvem.
