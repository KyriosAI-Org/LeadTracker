# 🚀 LeadTracker

Sistema de gestão de leads e performance para times de SDR (Sales Development Representatives). O LeadTracker permite o acompanhamento em tempo real de métricas, ranking de produtividade e gestão de metas, tudo integrado ao ecossistema Supabase.

## 🛠 Tecnologias

- **Framework:** [TanStack Start](https://tanstack.com/router/v1/docs/guide/start/overview) (React + Vite + SSR)
- **Estilização:** Tailwind CSS + Shadcn/ui
- **Backend/Database:** Supabase (Auth, PostgreSQL, RLS)
- **Deploy:** Docker + Portainer + Traefik

## 🚀 Como Rodar Localmente

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/KyriosAI-Org/LeadTracker.git
   cd LeadTracker
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   # ou
   bun install
   ```

3. **Configurar variáveis de ambiente:**
   Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais do Supabase.
   ```bash
   cp .env.example .env
   ```

4. **Rodar em modo dev:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

## 📦 Deploy

O projeto está totalmente otimizado para deploy em containers (Docker). Para instruções detalhadas sobre como configurar o GitHub Actions (GHCR) e o Portainer, consulte o guia de deploy:

👉 **[Guia de Deploy (DEPLOY.md)](./DEPLOY.md)**

## 📂 Organização do Projeto

- `src/`: Código fonte da aplicação.
  - `routes/`: Estrutura de rotas baseada em arquivo (TanStack Router).
  - `components/`: Componentes UI e lógicas de domínio.
  - `lib/`: Helpers, constantes e integração com Supabase.
- `supabase/`: Migrações e configurações do banco de dados.
- `claude-notes/`: Histórico de planejamento, checklists de validação e roteiros da fase de implementação.

## 📄 Licença

Este projeto é de uso interno da **KyriosAI-Org**.
