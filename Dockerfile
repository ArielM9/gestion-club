# syntax=docker/dockerfile:1.4
FROM node:20-slim AS base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies (skip postinstall which requires prisma schema)
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY packages ./packages
RUN npm install --ignore-scripts

# Generate Prisma client
FROM base AS prisma
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY packages ./packages
COPY .env* ./
RUN npx turbo run db:generate --filter=@repo/db

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prisma /app/packages/generated ./packages/generated
COPY turbo.json ./
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY .env* ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY packages ./packages

ENV NEXT_TURBOPACK=0
ENV NEXT_USE_WEBPACK=1
RUN npx turbo run build --filter=victorianos-gestion

# Production runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
