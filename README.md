# Copa Manager 2026

Plataforma web multiplayer local/online inspirada em managers clássicos de futebol. A base atual usa Next.js App Router, Neon Postgres e Vercel.

## Setup local

1. Instale Node.js 20+.
2. Copie `.env.example` para `.env.local`.
3. Preencha `DATABASE_URL` com a connection string do Neon e defina um `ADMIN_SECRET`.
4. Instale e rode:

```bash
npm install
npm run dev
```

5. Inicialize o banco abrindo:

```text
http://localhost:3000/api/setup?secret=SEU_ADMIN_SECRET
```

## Deploy na Vercel

Configure as variáveis `DATABASE_URL` e `ADMIN_SECRET` no projeto da Vercel. Depois rode o mesmo endpoint `/api/setup?secret=...` uma vez no domínio publicado.

## Segurança

Não commite `.env.local`. Se uma connection string foi compartilhada em chat ou print, rotacione a senha no Neon antes de produção.
