# StreamLocal — MVP SaaS (Next.js + PostgreSQL + Drizzle + Docker)

Plataforma portuguesa (pt-PT) que liga **marcas locais** a **streamers/criadores de live** para campanhas pagas em Twitch, YouTube Live (e futuramente Kick).

## 1. Arquitetura e decisões (resumo)

- **Next.js 14 App Router + TypeScript estrito**, React Server Components por defeito; Client Components só no overlay/QR e confirmações.
- **Tailwind + componentes próprios estilo shadcn** (sem dependência pesada), **Lucide**, **Zod** no servidor, formulários via Server Actions (+ React Hook Form pronto para evoluir).
- **PostgreSQL 16 + Drizzle ORM** com migrations versionadas (`src/db/migrations/0000_init.sql`), nunca `db:push` em prod.
- **Autenticação própria com sessões em BD** (cookie HttpOnly + `sessions` com hash SHA-256 + bcryptjs): evita providers externos no MVP; interface isolada em `src/lib/auth.ts`, pronta a migrar para Auth.js/NextAuth. Ver “Decisão de autenticação”.
- **Papéis**: `ADMIN`, `BRAND`, `STREAMER`; autorização sempre no servidor (`requireUser`/checks por `brandProfileId`/`streamerProfileId`).
- **Overlay OBS** em `/overlay/[token]` com token opaco de 64 chars hex, sem navegação, QR gerado localmente (`qrcode.react`), etiqueta “Parceria paga”.
- **Tracking interno**: `/go/[token]` regista `QR_PAGE_VIEW` e redireciona só para `destinationUrl` http/https da campanha; `/api/track` regista sessões de overlay com rate limit.
- **Rate limit em memória** (`src/lib/rate-limit.ts`) só para dev; documentado para trocar por Redis/Upstash em produção.
- **Auditoria** em `audit_logs` para registo, estados, campanhas, candidaturas e entregáveis.
- **Docker multi-stage + Compose** com healthcheck do Postgres e arranque que espera pela BD, corre migrations e seed.
- **Seed idempotente** com contas demo e 5 campanhas / 3 candidaturas / eventos para o relatório.
- **Segurança**: Zod em tudo, sem `passwordHash`/tokens em listas públicas, erros de login genéricos, `noopener noreferrer`, validação de URLs, headers de segurança no `next.config.mjs`.
- **Métricas rotuladas** como “Métricas da plataforma StreamLocal”, nunca como oficiais Twitch/YouTube.
- **Sem pagamentos/faturas/chat/IA** — serviços e tabelas desenhados para extensão (ex.: campos `currency/budgetCents`, `compensationType`).

### Decisão de autenticação

O enunciado pedia Auth.js/NextAuth + Drizzle adapter. Para um MVP Docker-local sem OAuth nem email externo, optou-se por **sessões próprias seguras** (token aleatório 256-bit, guardado com hash, cookie HttpOnly/SameSite-Lax, expiração 14 dias, `bcryptjs` cost 12). As tabelas `users`/`sessions` seguem o espírito do modelo; migrar para Auth.js é trocar `src/lib/auth.ts` + páginas `(auth)` sem mexer no schema de negócio.

## 2. Árvore de ficheiros

```
streamlocal/
├── Dockerfile  docker-compose.yml  .dockerignore  .env.example
├── package.json (pnpm)  tsconfig.json  next.config.mjs
├── tailwind.config.ts  postcss.config.js  drizzle.config.ts
├── scripts/start.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx  page.tsx  globals.css
│   │   ├── (auth)/login  (auth)/registar
│   │   ├── (public)/campanhas  (public)/campanhas/[slug]
│   │   ├── overlay/[token]  go/[token]  api/track
│   │   ├── dashboard/ (perfil, definicoes, marca/…, streamer/…)
│   │   └── admin/ (utilizadores, marcas, streamers, campanhas, audit)
│   ├── components/ (ui, layout, campaigns)
│   ├── actions/ (auth, campaigns, profiles)
│   ├── lib/ (auth, permissions, validations, utils, audit, rate-limit)
│   └── db/ (schema.ts, index.ts, migrate.ts, seed.ts, migrations/0000_init.sql)
└── README.md
```

## 3. Executar localmente com Docker

```bash
cp .env.example .env
docker compose up --build
# abre http://localhost:3000
```

O container `app` espera pela BD (`service_healthy` + espera ativa), corre `src/db/migrate.ts`, depois `src/db/seed.ts` (idempotente) e inicia o Next standalone.

Se as migrations/seed não correrem no arranque (ex.: compose antigo):

```bash
docker compose exec app npx tsx src/db/migrate.ts
docker compose exec app npx tsx src/db/seed.ts
```

Desenvolvimento sem Docker (precisa de Postgres local):

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Portas: app `3000`, Postgres `5432`. `DATABASE_URL` no Compose: `postgresql://streamlocal:streamlocal@db:5432/streamlocal`.

## 4. Credenciais de seed (só dev local)

| Papel | Email | Password |
|---|---|---|
| Admin | `admin@streamlocal.test` | `Admin123!` |
| Marca (Pixel Porto, aprovada) | `marca@pixelportugal.test` | `Marca123!` |
| Streamer (RafaelPlays, aprovado) | `streamer@rafaelplays.test` | `Streamer123!` |

Dados demo: 5 campanhas (2 `PUBLISHED`, 1 `ACTIVE`, 1 `DRAFT`, 1 `PENDING_REVIEW`), 3 candidaturas (`ACCEPTED`/`PENDING`/`SHORTLISTED`), deliverables + 12 eventos de overlay/QR na campanha ativa. Marcas fictícias, sem parcerias reais.

## 5. Cenários de aceitação (como testar)

1. Abrir `/` → navegar para login/registo.
2. Login admin → `/admin/campanhas` → publicar/rejeitar a campanha `PENDING_REVIEW`.
3. Login marca → `/dashboard/marca/campanhas/nova` → criar rascunho → abrir detalhe → “Submeter para revisão”.
4. Login streamer → `/campanhas` → ver publicadas.
5. Filtrar (plataforma/cidade) → abrir detalhe → candidatar-se (bloqueia duplicadas).
6. Login marca → detalhe da campanha → aceitar candidatura (cria `application_deliverables` + `overlayToken`, campanha passa a `MATCHED`).
7. Ver deliverables criados no detalhe da marca.
8. Login streamer → `/dashboard/streamer/candidaturas/[id]` → submeter evidência (URL/nota).
9. Abrir `/overlay/[token]` (link na página do streamer) → ver cupão/QR/CTA; `/go/[token]` regista QR e redireciona.
10. Detalhe da marca → relatório com candidaturas, aceites, views overlay/QR, cliques, streamers aceites.
11. Tudo em Docker com volume `pgdata` persistente (`docker compose down` mantém dados; `down -v` apaga).

## 6. Limitações honestas e próximos passos

- Rate limit em memória (reinicia com a app) → usar Redis/Upstash em produção.
- Sem OAuth Twitch/YouTube/Kick: canais e métricas são manuais; tabelas `platform`/`streamer_channels` já preveem integração.
- Sem pagamentos/escrow/faturas: só `budgetCents`/`compensationType`; integrar Stripe/MB Way depois.
- Sem chat real-time: mensagens vivem em `applications.message`/`brandNote`; adicionar Pusher/websockets depois.
- Sem i18n: todo o texto em pt-PT, strings inline prontas a extrair.
- Auditoria sem paginação avançada; pesquisa/filtros admin são básicos.
- Testes automatizados não incluídos no MVP (recomendado: Vitest + Playwright a seguir).
