# LeadTracker - Plano de Reestruturação Multiempresa

## 📊 Status Atual do Projeto

### ✅ Já Implementado
- **Banco de dados multi-tenant** (companies table)
- **User roles** (admin/sdr com enums)
- **RLS policies** tightened para isolamento por empresa
- **Company invites** para onboarding de SDRs
- **Company rankings view** (ranking de SDRs por métrica)
- **Achievements system** (conquistas baseadas em targets)
- **User streaks** (consecutivos de atividade)
- **Targets** (metas diárias/semanais por SDR ou empresa)
- **Helper functions** (get_user_company_id, get_sdr_stats)
- **AuthGate** com suporte a onboarding (múltiplas etapas)

### ⚠️ Parcialmente Implementado
- **Dashboard LeadForm** (mostra apenas formulário, não o dashboard admin)
- **LeadTable** (mostra leads, sem filtros por perfil)
- **Autenticação** (Auth básico do Supabase, sem gestão de permissões frontend)

### ❌ Não Implementado (Foco de Desenvolvimento)
- **Dashboard Admin/Gestor** (métricas empresa, SDRs, comparativos)
- **Dashboard SDR** (métricas pessoais, histórico, ranking)
- **Gestão de SDRs** (CRUD, ativação/desativação)
- **Sistema de Metas** (interface visual, progresso)
- **Gamificação visual** (badges, streaks, ranking semanal)
- **Histórico individual** (por SDR, com evolução)
- **Relatórios** (exportar, filtros avançados)
- **Modo tempo real** (websockets/polling)

---

## 🎯 Roadmap Priorizado

### **FASE 1: Foundation UI (Prioridade Alta)**
Objetivo: Estruturar navegação e layouts para admin/sdr

#### 1.1 Sistema de Routing por Role ⭐
- [ ] Criar middleware de autenticação + role check
- [ ] Rutas `/admin/*` (só admin)
- [ ] Rutas `/sdr/*` (só sdr)
- [ ] Redirect automático baseado no role
- **Arquivos a criar/modificar:**
  - `src/lib/auth-helpers.ts` (funções de verificação)
  - `src/routes/__root.tsx` (ajustar layout)

#### 1.2 Layout Base Admin
- [ ] Sidebar com menu (Visão Geral, SDRs, Metas, Relatórios, Configurações)
- [ ] Header com logo + user menu
- [ ] Breadcrumb navigation
- **Arquivo: `src/components/layouts/AdminLayout.tsx`**

#### 1.3 Layout Base SDR
- [ ] Sidebar simplificado (Dashboard, Histórico, Ranking, Perfil)
- [ ] Header compacto
- **Arquivo: `src/components/layouts/SDRLayout.tsx`**

---

### **FASE 2: Admin Dashboard (Prioridade Alta)**
Objetivo: Visão 360° dos negócios da empresa

#### 2.1 Métricas de Topo
- [ ] KPI Cards: Calls totais | Reuniões | Taxa conversão | Goal de hoje
- **Arquivo: `src/components/dashboard/admin/AdminMetricsCards.tsx`**
- **Queries:** Usar `get_sdr_stats` + agregar por company_id

#### 2.2 Gráficos
- [ ] Calls por dia (últimos 7-30 dias)
- [ ] Funnelconversão (Calls → Reuniões → Deal)
- [ ] Distribuição de motivos de perda
- **Arquivo: `src/components/dashboard/admin/AdminCharts.tsx`**
- **Lib: Usar Recharts (já instalado)**

#### 2.3 Ranking de SDRs
- [ ] Tabela + Cards mostrando:
  - Posição | Nome | Calls | Reuniões | Taxa conversão
  - Cor/badge para top performer
- [ ] Ordenação interativa
- **Arquivo: `src/components/dashboard/admin/SDRRanking.tsx`**
- **Dado: Query `company_rankings` view**

#### 2.4 Comparativo Visual (Heat Map)
- [ ] Heatmap: SDR × Métrica (Calls, Reuniões, Taxa Conv.)
- [ ] Identifica padrões de performance
- **Arquivo: `src/components/dashboard/admin/PerformanceHeatmap.tsx`**

---

### **FASE 3: Gestão de SDRs (Prioridade Alta)**
Objetivo: Criar, editar, remover, ativar/desativar SDRs

#### 3.1 Page de Gestão
- [ ] Tabela com SDRs (Nome, Email, Role, Status, Ações)
- [ ] Botão "Convidar novo SDR"
- [ ] Ações: Editar | Desativar | Ver histórico
- **Arquivo: `src/routes/admin/team.tsx`**
- **Query: SELECT * FROM profiles WHERE company_id = X AND role = 'sdr'**

#### 3.2 Modal de Convite
- [ ] Form: Email + Role (sdr/admin future)
- [ ] Gera token + envia por email (ou mostra link)
- [ ] Validações
- **Arquivo: `src/components/auth/InviteSDRModal.tsx`**
- **Mutation: INSERT INTO company_invites**

#### 3.3 Ativar/Desativar SDR
- [ ] Soft delete ou status column
- [ ] Toggle on profile update
- **Modificação: `ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true`**

---

### **FASE 4: SDR Dashboard (Prioridade Média)**
Objetivo: Visão pessoal do SDR de sua performance

#### 4.1 Métricas Pessoais
- [ ] Cards: Calls hoje | Reuniões hoje | Taxa conversão | Goal pessoal
- [ ] Streak atual + max streak
- **Arquivo: `src/components/dashboard/sdr/SDRMetricsCards.tsx`**

#### 4.2 Histórico de Calls
- [ ] Tabela paginada: Data | Contato | Status | Motivo
- [ ] Filtros: Data, Status, Tag
- [ ] Ações: Editar | Deletar (próprio apenas)
- **Arquivo: `src/components/leads/SDRLeadHistory.tsx`**

#### 4.3 Ranking Pessoal
- [ ] Posição na empresa + top 5 à frente
- [ ] Comparativo: eu vs líder
- **Arquivo: `src/components/dashboard/sdr/PersonalRanking.tsx`**

#### 4.4 Evolução Gráfica
- [ ] Gráfico: Calls + Reuniões por dia (últimos 30)
- [ ] Taxa conversão ao longo do tempo
- **Arquivo: `src/components/dashboard/sdr/PerformanceTrend.tsx`**

---

### **FASE 5: Sistema de Metas (Prioridade Média)**
Objetivo: Visualização de progress contra targets

#### 5.1 UI de Metas (Admin)
- [ ] Criar/editar meta geral (calls diários, reuniões semanais)
- [ ] Metas por SDR (override)
- [ ] Visualizar progresso de todos
- **Arquivo: `src/routes/admin/goals.tsx`**

#### 5.2 Progresso Visual (Barra/Circular)
- [ ] Componente: ProgressCard (atual vs meta)
- [ ] Colores: green (atingiu) | yellow (90%+) | red (< 50%)
- **Arquivo: `src/components/goals/GoalProgressCard.tsx`**

#### 5.3 Integração no Dashboard
- [ ] Admin vê progresso de todos
- [ ] SDR vê seu progresso pessoal
- [ ] Atualização em tempo real (ou refresh a cada ação)

---

### **FASE 6: Gamificação (Prioridade Média-Baixa)**
Objetivo: Motivação via badges, streaks, ranking

#### 6.1 Badges/Achievements Visual
- [ ] Listar conquistas desbloqueadas
- [ ] Próximas conquistas (faltam X)
- [ ] Ícones lucide-react
- **Arquivo: `src/components/gamification/AchievementsList.tsx`**

#### 6.2 Streak Display
- [ ] Card mostrando: Streak atual | Max streak
- [ ] Flame icon para indicar ativo
- [ ] Aviso se streak vai quebrar
- **Arquivo: `src/components/gamification/StreakCard.tsx`**

#### 6.3 Ranking Semanal (Admin)
- [ ] Top 3 + Pódio visual
- [ ] Reset automático segunda-feira
- [ ] Badge "SDR da Semana"
- **Arquivo: `src/components/gamification/WeeklyRanking.tsx`**

---

### **FASE 7: Melhorias (Prioridade Baixa)**
Objetivo: Polish e funcionalidades extras

#### 7.1 Sistema de Tags Avançado
- [ ] Tag CRUD
- [ ] Sugestões ao registrar lead
- [ ] Filtros por tag

#### 7.2 Modo Tempo Real
- [ ] WebSocket ou polling para live metrics
- [ ] "João marcou uma reunião!" em tempo real
- [ ] Notificações push (optional)

#### 7.3 Relatórios Exportáveis
- [ ] Export CSV/PDF
- [ ] Filtros avançados (período, SDR, tag)

#### 7.4 Integração com Supabase Realtime
- [ ] Atualização live de rankings
- [ ] Notificações quando SDR marca reunião

---

## 📁 Estrutura de Arquivos Proposta

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthGate.tsx (✅ existente)
│   │   ├── InviteSDRModal.tsx (❌ novo)
│   │   └── RoleGuard.tsx (❌ novo)
│   ├── layouts/
│   │   ├── AdminLayout.tsx (❌ novo)
│   │   ├── SDRLayout.tsx (❌ novo)
│   │   └── RoleBasedLayout.tsx (❌ novo)
│   ├── dashboard/
│   │   ├── admin/
│   │   │   ├── AdminMetricsCards.tsx (❌ novo)
│   │   │   ├── AdminCharts.tsx (❌ novo)
│   │   │   ├── SDRRanking.tsx (❌ novo)
│   │   │   └── PerformanceHeatmap.tsx (❌ novo)
│   │   └── sdr/
│   │       ├── SDRMetricsCards.tsx (❌ novo)
│   │       ├── PersonalRanking.tsx (❌ novo)
│   │       └── PerformanceTrend.tsx (❌ novo)
│   ├── goals/
│   │   └── GoalProgressCard.tsx (❌ novo)
│   ├── gamification/
│   │   ├── AchievementsList.tsx (❌ novo)
│   │   ├── StreakCard.tsx (❌ novo)
│   │   └── WeeklyRanking.tsx (❌ novo)
│   ├── leads/
│   │   ├── LeadForm.tsx (✅ existente)
│   │   ├── LeadTable.tsx (✅ existente)
│   │   ├── SDRLeadHistory.tsx (❌ novo)
│   │   └── LeadFormModal.tsx (❌ novo)
│   └── ui/ (✅ existente)
├── lib/
│   ├── auth-helpers.ts (❌ novo)
│   ├── api/ (❌ novos endpoints)
│   │   ├── admin.ts
│   │   ├── sdr.ts
│   │   └── goals.ts
│   └── ... (existentes)
├── hooks/
│   ├── useAdminStats.ts (❌ novo)
│   ├── useSDRStats.ts (❌ novo)
│   └── ... (existentes)
├── routes/
│   ├── __root.tsx (⚠️ modificar)
│   ├── index.tsx (⚠️ modificar - redirect por role)
│   ├── dashboard.tsx (⚠️ modificar - remover ou ajustar)
│   ├── admin/
│   │   ├── __layout.tsx (❌ novo)
│   │   ├── index.tsx (❌ novo - dashboard admin)
│   │   ├── team.tsx (❌ novo - gestão sdrs)
│   │   └── goals.tsx (❌ novo - gestão metas)
│   └── sdr/
│       ├── __layout.tsx (❌ novo)
│       ├── index.tsx (❌ novo - dashboard sdr)
│       ├── history.tsx (❌ novo - histórico)
│       └── calls.tsx (❌ novo - registrar call)
└── integrations/
    └── supabase/
        ├── client.ts (✅ existente)
        ├── client.server.ts (✅ existente)
        └── types.ts (✅ existente)
```

---

## 🔧 Mudanças no Banco de Dados Necessárias

### Migrations a Criar

#### 1. Add status to profiles
```sql
ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;
```

#### 2. Enhance leads with additional fields
```sql
ALTER TABLE public.leads 
  ADD COLUMN performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  ADD COLUMN notes TEXT,
  ADD COLUMN call_duration INTEGER, -- segundos
  ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
```

#### 3. Company settings
```sql
CREATE TABLE public.company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  daily_calls_target INTEGER DEFAULT 50,
  weekly_meetings_target INTEGER DEFAULT 5,
  theme TEXT DEFAULT 'light',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 4. Weekly rankings (snapshot)
```sql
CREATE TABLE public.weekly_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sdr_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  calls INTEGER,
  meetings INTEGER,
  conversion_rate FLOAT,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, sdr_id, week_start)
);
```

---

## 📋 Checklist de Desenvolvimento

### FASE 1 ✅ CONCLUÍDO
- [x] Criar `src/lib/auth-helpers.ts` (checkAdmin, checkSDR, getUserRole)
- [x] Criar `src/components/auth/RoleGuard.tsx`
- [x] Criar `src/components/layouts/AdminLayout.tsx`
- [x] Criar `src/components/layouts/SDRLayout.tsx`
- [x] Ajustar rotas (`index.tsx` + admin + sdr routes)
- [x] Criar rotas admin: `/admin`, `/admin/team`, `/admin/goals`
- [x] Criar rotas sdr: `/sdr`, `/sdr/history`, `/sdr/ranking`, `/sdr/profile`
- [x] Migration para adicionar `is_active` em profiles

### FASE 2
- [ ] Criar dashboard admin page
- [ ] Criar metrics cards admin
- [ ] Criar charts component
- [ ] Criar SDR ranking table
- [ ] Criar performance heatmap

### FASE 3
- [ ] Criar team management page
- [ ] Criar invite modal
- [ ] Criar mutations para invite/create/deactivate SDR
- [ ] Criar RLS policies para company_invites

### FASE 4
- [ ] Criar dashboard SDR page
- [ ] Criar metrics cards SDR
- [ ] Criar lead history table
- [ ] Criar personal ranking
- [ ] Criar performance trend chart

### FASE 5
- [ ] Criar goals management page
- [ ] Criar progress card component
- [ ] Integrar em dashboards

### FASE 6
- [ ] Criar achievements list
- [ ] Criar streak card
- [ ] Criar weekly ranking
- [ ] Integrar em dashboards

### FASE 7
- [ ] Melhorias conforme needed

---

## 🚀 Próximos Passos Imediatos

1. **Começar com FASE 1** → Routing e Layouts
2. **Testar role-based navigation** → Verificar RLS
3. **Avançar para FASE 2** → Admin Dashboard
4. **Iterar e refinar** conforme feedback

---

## 📝 Notas Importantes

- **RLS policies** já estão configuradas e tight
- **Database schema** já suporta multi-tenant
- **Achievements + Streaks** já estão funcionando (triggers)
- **Company rankings view** está ready
- **Focus:** Frontend components + pages

---

## 🔗 Recursos Úteis

- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **TanStack Router**: https://tanstack.com/router/latest
- **Recharts**: https://recharts.org/
- **Tailwind CSS**: Já configurado no projeto

