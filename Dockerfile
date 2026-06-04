# syntax=docker/dockerfile:1

# ============================================================================
# Stage 1 — build (Node 22.x já satisfaz o requisito >=22.12 do Vite/nitro)
# ============================================================================
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Emite um servidor Node standalone (dist/server/index.mjs) em vez do
# worker Cloudflare padrão. Lido em vite.config.ts.
ENV NITRO_PRESET=node-server

# Variáveis PÚBLICAS do Supabase são embutidas no bundle do browser em build.
# Passe via --build-arg (docker-compose já faz isso a partir do .env).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Chama o vite direto (o node do container já é 22.x; sem o wrapper npx).
RUN node node_modules/vite/bin/vite.js build

# ============================================================================
# Stage 2 — runtime (imagem enxuta, só o build de produção)
# ============================================================================
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# nitro empacota o servidor + suas deps em dist/server e os estáticos em
# dist/client. Nada de npm install aqui.
COPY --from=build /app/dist ./dist

# Garante que o usuário node tenha permissão nos arquivos copiados.
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "dist/server/index.mjs"]
