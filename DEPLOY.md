# Deploy — LeadTracker (Traefik + Portainer)

## Arquitetura

```
                    Internet
                       │  https://leadtracker.kyriosai.me
                       ▼
              ┌──────────────────┐
              │     Traefik      │  TLS (Let's Encrypt), entrypoint websecure
              │  (rede externa   │  roteia por Host() via labels
              │   traefik-net)   │
              └────────┬─────────┘
                       │  http  →  container:3000
                       ▼
            ┌────────────────────────┐
            │  container leadtracker │  Node 22 (nitro node-server)
            │  dist/server/index.mjs │  SSR + serve estáticos (dist/client)
            └───────────┬────────────┘
                        │  HTTPS (anon + service_role)
                        ▼
                 ┌──────────────┐
                 │  Supabase    │  Auth + Postgres (cloud)
                 │  (cloud)     │
                 └──────────────┘
```

- **App**: TanStack Start (Vite + React, SSR). O build de produção usa o preset
  `node-server` do nitro (`NITRO_PRESET=node-server`, ver `vite.config.ts`),
  gerando um servidor Node standalone em `dist/server/index.mjs` que também
  serve os estáticos de `dist/client`. Escuta na porta **3000**.
- **Traefik**: já roda na VPS. Descobre o container pelas *labels* e cuida de
  TLS/HTTPS. Nada de expor portas no host — comunicação interna via `traefik-net`.
- **Banco**: Supabase cloud (não containerizado). Multi-tenant por `company_id`.

## Variáveis de ambiente

| Variável | Onde é usada | Sensível? |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | **build** (embutidas no bundle do browser) | Não (públicas) |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | runtime (SSR) | Não |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime (server functions, gestão de equipe) | **SIM** — só servidor |
| `PORT` | runtime (default 3000) | Não |
| `APP_DOMAIN` | runtime/labels (ex: `leadtracker.meudominio.com`) | Não |

As `VITE_*` são lidas em tempo de build (Vite faz a substituição estática), por
isso o `docker-compose.yml` as passa como `build args`. As demais são injetadas
em runtime via variáveis de ambiente da Stack no Portainer.

## Passo a passo (Portainer)

1. **DNS**: crie um registro `A` de `seu-app.dominio.com` apontando para o IP da VPS.
2. **Rede**: confirme que a rede externa do Traefik existe (provavelmente já):
   ```bash
   docker network ls | grep traefik-net   # se não existir: docker network create traefik-net
   ```
3. **Código + segredos na VPS**: clone o repositório e crie o `.env` a partir do
   modelo (o `.env` **não** vai no git):
   ```bash
   cp .env.example .env && nano .env   # preencha as chaves do Supabase e o APP_DOMAIN
   ```
4. **Stack no Portainer**:
   - *Stacks → Add stack → Repository* apontando para este repo (o compose tem
     `build:`, então o Portainer constrói a imagem na VPS), **ou**
   - *Web editor*: cole o `docker-compose.yml`. Nesse caso garanta que o `.env`
     esteja no diretório do build.
   - Em **Environment variables** do Portainer, preencha todas as variáveis (VITE_*, SUPABASE_*, APP_DOMAIN).
5. **Deploy**. O Traefik detecta as labels e emite o certificado automaticamente.
   Acesse o domínio configurado em `APP_DOMAIN`.

## Otimizações de Produção
- **Segurança**: O container roda com usuário não-privilegiado (`node`).
- **Escalabilidade**: `container_name` foi removido para permitir múltiplas instâncias.
- **Recursos**: Limites de CPU (0.5) e Memória (512MB) configurados via Compose.

## Build/teste local (opcional)

```bash
docker compose build      # lê .env para os build args
docker compose up -d
# ou, sem Traefik, expondo a porta:
docker run --env-file .env -p 3000:3000 leadtracker:latest
```

## Notas
- O primeiro acesso precisa de um admin: faça o **cadastro/onboarding** pela tela
  de login (cria empresa + admin).
- Atualizar versão: `git pull` na VPS e *Update/Redeploy* da stack no Portainer
  (com *re-pull/rebuild* ativo).
