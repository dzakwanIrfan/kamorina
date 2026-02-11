
# Stage 1: Base image with pnpm
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
RUN apk add --no-cache openssl

WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate

# Stage 3: Development (with hot-reload)
FROM deps AS dev

COPY . .

EXPOSE 3001

CMD ["pnpm", "start:dev"]

# Stage 4: Build for production
FROM deps AS builder

COPY . .

RUN pnpm build

# Stage 5: Production runner
FROM node:20-alpine AS prod

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and install production-only dependencies
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile --prod
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads

# Set non-root user for security
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nestjs /app
USER nestjs

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/main"]
