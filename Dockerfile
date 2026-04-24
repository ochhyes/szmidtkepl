# =============================================================================
# szmidtke.pl — multi-stage Dockerfile (Astro 5 + adapter Node standalone)
# Build stage: instaluje zależności, odpala astro check + build.
# Runtime stage: tylko dist/ + node_modules produkcyjne, ~120 MB total.
# =============================================================================

# --------- Stage 1: build -------------
FROM node:20-alpine AS build
WORKDIR /app

# Cache zależności — warstwa się nie zmienia, jeśli package*.json nietknięte.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Kod
COPY . .

# PUBLIC_* trafia do builda jako build-arg (Vite inline'uje import.meta.env.PUBLIC_*).
# Sekrety runtime (BUTTONDOWN_API_KEY itp.) zostają w env_file/runtime — nie w warstwach obrazu.
ARG PUBLIC_PLAUSIBLE_DOMAIN=""
ENV PUBLIC_PLAUSIBLE_DOMAIN=$PUBLIC_PLAUSIBLE_DOMAIN

# Build — astro check + astro build. Wymaga pełnych dev deps.
RUN npm run build

# --------- Stage 2: runtime -----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Tylko produkcyjne deps dla adaptera Node.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Skopiuj wyniki build
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Adapter Node standalone — entrypoint wygenerowany przez @astrojs/node.
CMD ["node", "./dist/server/entry.mjs"]
