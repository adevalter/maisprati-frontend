# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Build (Next.js — NEXT_PUBLIC_* embutido no bundle)
# -----------------------------------------------------------------------------
FROM node:22.23.1-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# -----------------------------------------------------------------------------
# Runtime (Next.js standalone na porta 3000; Traefik faz TLS)
# -----------------------------------------------------------------------------
FROM node:22.23.1-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk upgrade --no-cache

COPY --from=build --chown=1000:1000 /app/public ./public
COPY --from=build --chown=1000:1000 /app/.next/standalone ./
COPY --from=build --chown=1000:1000 /app/.next/static ./.next/static

USER 1000:1000

EXPOSE 3000

CMD ["node", "server.js"]
