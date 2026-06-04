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

As `VITE_*` são lidas em tempo de build (Vite faz a substituição estática).

### Opção A: Deploy via Repositório (Build na VPS)
1. **DNS**: aponte o registro `A` para a VPS.
2. **Código**: clone o repo e crie o `.env`.
3. **Stack**: No Portainer, aponte para o repositório Git. O Compose construirá a imagem localmente.

### Opção B: Deploy via Imagem (GHCR.io + Portainer)
Esta é a opção recomendada para produção (mais rápida e desacoplada do código fonte na VPS).

1. **Configurar GitHub Secrets**:
   No GitHub (*Settings -> Secrets -> Actions*), adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
2. **Build**: O GitHub Actions criará a imagem automaticamente no GHCR a cada push na `main`.
3. **Portainer**:
   - Vá em *Stacks -> Add stack -> Web editor*.
   - Cole o conteúdo de `docker-compose.portainer.yml`.
   - Substitua a linha da `image:` pelo caminho real da sua imagem no GHCR (ex: `ghcr.io/kyriosai-org/leadtracker:latest`).
   - Configure as **Environment variables** (Runtime) na interface do Portainer:
     - `SUPABASE_URL`
     - `SUPABASE_PUBLISHABLE_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `APP_DOMAIN`

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
