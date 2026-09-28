# deps
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# builder
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app
ARG DATABASE_URL=postgresql://streamlocal:streamlocal@localhost:5432/streamlocal
ARG SESSION_SECRET=build-dummy-secret-0123456789abcdef
ENV DATABASE_URL=$DATABASE_URL SESSION_SECRET=$SESSION_SECRET NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json /app/drizzle.config.ts ./
COPY --from=deps /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "./scripts/start.mjs"]
