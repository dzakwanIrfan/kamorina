
# Stage 1: Base image with pnpm
FROM node:20-slim AS base

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Stage 3: Development (with hot-reload)
FROM deps AS dev

COPY . .

EXPOSE 3000

ENV WATCHPACK_POLLING=true

CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

# Stage 4: Build for production
FROM deps AS builder

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# Stage 5: Production runner
FROM node:20-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
