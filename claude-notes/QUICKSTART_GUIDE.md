# 🚀 Guia de Uso - LeadTracker FASE 1

## Como Testar a Nova Estrutura

### Pré-requisitos
- Node.js 22.12+ (ou use `npx -y node@22.12.0`)
- Servidor dev rodando: `npx -y node@22.12.0 node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 3000`

---

## 📱 Fluxo de Uso

### 1. **Login/Registro**
- Acesse `http://localhost:3000`
- Você será redirecionado para a tela de autenticação (AuthGate)
- Login com email e senha

### 2. **Redirecionamento Automático**
Após login, você será redirecionado **automaticamente** para:
- `/admin` se você tiver **role = admin**
- `/sdr` se você tiver **role = sdr**

---

## 👨‍💼 Se você é **ADMIN**

### Dashboard Admin (`/admin`)
**URL:** `http://localhost:3000/admin`

**O que você vê:**
- Visão Geral com placeholders de KPIs:
  - 📞 Calls Totais
  - 📅 Reuniões
  - 📈 Taxa Conversão
  - 👥 SDRs Ativos
- Placeholders de gráficos (em desenvolvimento)
- Placeholder de ranking de SDRs

### Gestão de Equipe (`/admin/team`)
**URL:** `http://localhost:3000/admin/team`

**O que você pode fazer:**
- ✅ Ver lista de todos os SDRs da sua empresa
- ✅ Ver status (Ativo/Inativo)
- ✅ Acessar menu de ações por SDR:
  - Ver Histórico
  - Editar
  - Desativar/Ativar
- 🔄 Convidar novo SDR (button - funcionalidade em breve)

**Dados exibidos:**
- Nome, Email, Role, Status, Data de Criação

### Gestão de Metas (`/admin/goals`)
**URL:** `http://localhost:3000/admin/goals`

**Status:** Em desenvolvimento (placeholder)

### Menu Admin
No sidebar esquerdo, você verá:
- 📊 Visão Geral → `/admin`
- 👥 Equipe → `/admin/team`
- 🎯 Metas → `/admin/goals`
- ⚙️ Configurações → (em desenvolvimento)

---

## 👤 Se você é **SDR**

### Meu Dashboard (`/sdr`)
**URL:** `http://localhost:3000/sdr`

**O que você vê em tempo real:**
- 📞 **Calls Hoje** - Quantas ligações você fez hoje
- 📅 **Reuniões Hoje** - Quantas reuniões agendou hoje
- 🔥 **Streak Atual** - Quantos dias seguidos de atividade
- 🏆 **Melhor Streak** - Seu melhor recorde

**Dados são carregados do banco em tempo real!**

Placeholders:
- Gráfico de evolução de calls
- Gráfico de taxa conversão
- Lista de chamadas recentes

### Histórico de Calls (`/sdr/history`)
**URL:** `http://localhost:3000/sdr/history`

**O que você vê:**
- ✅ Tabela completa de todas as suas ligações
- Colunas: Contato, Empresa, Status, Tags, Data
- Ordenação automática por data mais recente

**Funcionalidades futuras:**
- Filtros por período
- Filtros por status
- Edição de calls
- Exclusão de calls

### Ranking da Equipe (`/sdr/ranking`)
**URL:** `http://localhost:3000/sdr/ranking`

**O que você vê:**
- 🎯 **Sua Posição** - Destacada com dados pessoais
  - Posição no ranking
  - Total de calls
  - Total de reuniões
  - Taxa de conversão
  
- 🏆 **Ranking Completo** - Todos os SDRs da empresa
  - Pódio visual (🥇 🥈 🥉)
  - Nome, Calls, Reuniões, Taxa Conversão
  - Sua posição destacada

### Perfil (`/sdr/profile`)
**URL:** `http://localhost:3000/sdr/profile`

**O que você vê:**
- 👤 Informações Pessoais: Nome, Email, Role
- 🏢 Informações da Empresa: Nome, Data Criação
- Botões para editar perfil e alterar senha (placeholders)

### Menu SDR
No sidebar esquerdo, você verá:
- 📊 Meu Dashboard → `/sdr`
- 📋 Histórico → `/sdr/history`
- 🏆 Ranking → `/sdr/ranking`
- 👤 Perfil → `/sdr/profile`

---

## 🔒 Segurança e Proteção

### RoleGuard - Proteção de Rotas
Todas as rotas estão protegidas:
- ✅ Admin não pode acessar `/sdr/*`
- ✅ SDR não pode acessar `/admin/*`
- ✅ Se tentar acessar rota protegida, é redirecionado

**Teste:**
1. Faça login como admin
2. Tente acessar `http://localhost:3000/sdr` manualmente
3. Você será redirecionado para `/admin`

---

## 🎮 Teste o Fluxo Completo

### Cenário 1: Admin Gerenciando Equipe
```
1. Login como admin
2. Acesse /admin/team
3. Veja lista de SDRs
4. Clique em um dropdown de ações
5. Explore as opções
```

### Cenário 2: SDR Acompanhando Performance
```
1. Login como sdr
2. Veja stats em tempo real no dashboard
3. Acesse /sdr/ranking para ver onde está
4. Veja seu histórico em /sdr/history
5. Confira seus dados em /sdr/profile
```

### Cenário 3: Logout
```
1. Em qualquer página, clique no user menu (canto superior direito)
2. Clique "Sair"
3. Você volta para a tela de login
```

---

## 🐛 Troubleshooting

### "Página em branco ou erro de carregamento"
- Verifique se o servidor está rodando: `http://localhost:3000`
- Abra console (F12) para ver erros

### "Não consigo fazer login"
- Verifique se o Supabase está configurado (`.env`)
- Tente criar uma nova conta via Sign Up

### "Fui redirecionado, mas preciso mudar de página"
- Isso é **esperado!** Cada role tem seu próprio fluxo
- Você será sempre redirecionado para seu dashboard apropriado

### "Os dados não estão atualizando"
- Os dados carregam ao abrir a página
- Para atualizar, faça refresh (F5)
- **Próximo passo:** Adicionar auto-refresh com React Query

---

## 📊 Dados Reais vs Placeholders

### ✅ Dados Reais (Carregam do Supabase)
- Admin - Lista de SDRs em `/admin/team`
- SDR - Stats do dia em `/sdr`
- SDR - Histórico de calls em `/sdr/history`
- SDR - Ranking em `/sdr/ranking`
- SDR - Perfil em `/sdr/profile`

### 🔄 Placeholders (Em Desenvolvimento)
- Admin - Gráficos em `/admin`
- Admin - Metas em `/admin/goals`
- SDR - Gráficos em `/sdr`
- SDR - Calls recentes em `/sdr`
- SDR - Botões de ação (Editar, Alterar senha)

---

## 🎯 Próximos Passos (FASE 2)

Após testar a FASE 1, o que vem:
1. **Gráficos Reais** - Integrar Recharts com dados de calls
2. **Metrics Admin** - Cards com dados reais de KPIs
3. **Gamificação** - Badges, streaks visuais
4. **Metas** - Interface de gestão de targets
5. **Convites** - Modal para convidar SDRs

---

## 💡 Dicas

- **Sidebar:** Clique no ícone de menu para colapsar/expandir
- **Mobile:** O sidebar fica automático no mobile
- **User Menu:** Clique na inicial do seu nome (canto superior direito)
- **Breadcrumbs:** Próximo passo será adicionar (navegação melhorada)

---

## 🆘 Dúvidas ou Problemas?

Verifique os logs:
- `console.log` no browser (F12)
- Terminal onde o servidor está rodando
- Arquivo `RESTRUCTURING_PLAN.md` para entender a arquitetura completa

---

**Versão:** FASE 1 - Foundation
**Data:** 29 de Maio de 2026
**Status:** ✅ Pronto para Testes
