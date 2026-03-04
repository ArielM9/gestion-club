# syntax=docker/dockerfile:1.4
FROM node:20-slim AS base

# Install openssl for Prisma and gnupg for yarn
RUN apt-get update && apt-get install -y openssl curl gnupg && rm -rf /var/lib/apt/lists/*

# Install yarn
RUN curl -o- -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn && rm -rf /var/lib/apt/lists/*

# Install dependencies (skip postinstall which requires prisma schema)
FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* ./
COPY turbo.json ./
COPY packages ./packages
RUN yarn install --ignore-scripts --ignore-engines

# Generate Prisma client
FROM base AS prisma
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock* ./
COPY turbo.json ./
COPY packages ./packages
COPY .env* ./
RUN npx prisma generate --schema=packages/db/schema.prisma

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/packages/generated/prisma ./packages/generated/prisma
COPY turbo.json ./
COPY package.json yarn.lock* ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY .env* ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY packages ./packages

ENV NEXT_TURBOPACK=0
ENV NEXT_USE_WEBPACK=1
RUN yarn build

# Production runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "node_modules/next/dist/bin/next", "start"]
