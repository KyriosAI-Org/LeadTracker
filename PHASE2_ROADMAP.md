# 🚀 FASE 2 - Próximos Passos

## 📍 Onde Estamos

A **FASE 1** foi concluída com sucesso:
- ✅ Routing por role implementado
- ✅ Layouts específicos criados
- ✅ 8 rotas funcionando com dados reais
- ✅ Segurança RLS configurada

**Próximo:** Transformar placeholders em dashboards reais com dados e gráficos.

---

## 🎯 Prioridade FASE 2: Admin Dashboard + Gráficos

### Por que começar aqui?
1. Admin precisa visualizar performance da equipe
2. Gráficos e metrics cards são componentes reutilizáveis
3. Dados já existem no banco (tables: leads, profiles, company_rankings)
4. Recharts já está instalado no projeto

---

## 📋 Checklist FASE 2

### 1️⃣ Criar Componentes de Metrics 
**Status:** ❌ TODO
**Tempo:** ~2h

- [ ] `AdminMetricsCards.tsx` - Cards com 4 KPIs
  - Total de Calls (COUNT leads WHERE company_id = X)
  - Total de Reuniões (COUNT leads WHERE status = 'Agendada')
  - Taxa de Conversão (meetings/calls * 100)
  - SDRs Ativos (COUNT profiles WHERE company_id = X AND is_active = true)
  
- [ ] `SDRMetricsCards.tsx` - Já existe `/sdr`, melhorar design
  - Calls Hoje
  - Reuniões Hoje
  - Streak Atual
  - Meta do Dia (se existir)

**Arquivo:** `src/components/dashboard/`

### 2️⃣ Criar Componentes de Gráficos
**Status:** ❌ TODO
**Tempo:** ~3h
**Biblioteca:** Recharts (já instalado)

- [ ] `CallsChart.tsx` - Gráfico de linhas
  - X: Últimos 7-30 dias
  - Y: Número de calls por dia
  - Filtro por período

- [ ] `ConversionChart.tsx` - Gráfico de barras
  - X: Últimos 7-30 dias
  - Y: Taxa de conversão (%)
  - Mostrar meta como linha

- [ ] `FunnelChart.tsx` - Funil de conversão
  - Calls → Reuniões → Deal
  - Percentuais em cada etapa

- [ ] `StatusDistribution.tsx` - Gráfico de pizza
  - Distribuição de status (Agendada, Não Interessada, Em Progresso)

**Arquivo:** `src/components/dashboard/charts/`

**Exemplo de Query para Calls por Dia:**
```typescript
const { data: callsByDay } = await supabase
  .from('leads')
  .select('created_at, status')
  .eq('company_id', companyId)
  .gte('created_at', sevenDaysAgo)
  .lte('created_at', today);

// Agrupar por dia e contar
const grouped = groupBy(callsByDay, (lead) => lead.created_at.split('T')[0]);
const chartData = Object.entries(grouped).map(([date, calls]) => ({
  date,
  calls: calls.length,
  meetings: calls.filter(c => c.status === 'Agendada').length,
}));
```

### 3️⃣ Integrar no Admin Dashboard
**Status:** ❌ TODO
**Tempo:** ~1h

- [ ] Atualizar `/admin/index.tsx`
  - Remover cards placeholders
  - Importar `AdminMetricsCards.tsx` com dados reais
  - Adicionar `CallsChart.tsx`
  - Adicionar `ConversionChart.tsx`
  - Adicionar `FunnelChart.tsx`

- [ ] Adicionar loading states
  - Skeleton loaders enquanto busca dados
  - Error handling

### 4️⃣ Criar Heatmap de Performance
**Status:** ❌ TODO
**Tempo:** ~2h

- [ ] `PerformanceHeatmap.tsx`
  - Eixo Y: SDRs
  - Eixo X: Métricas (Calls, Reuniões, Taxa Conv, Eficiência)
  - Cores: Verde (top) → Vermelho (bottom)
  - Mostra quem tá bem e quem precisa de ajuda

**Dados:** Use view `company_rankings`

### 5️⃣ Melhorar Ranking de SDRs
**Status:** ⚠️ PARCIAL
**Tempo:** ~1h

- [ ] Adicionar posição numérica (1º, 2º, 3º...)
- [ ] Adicionar badges para top performers
  - 🏆 Top Calls
  - 🎯 Melhor Conversão
  - 🚀 Melhor Crescimento
- [ ] Adicionar sparkline (gráfico mini) com evolução
- [ ] Fazer sortable (clique em header para ordenar)

---

## 🛠️ Tecnicalidades para FASE 2

### Queries que você vai precisar

**1. Metrics Admin**
```typescript
// Calls e Reuniões
const { data: leads } = await supabase
  .from('leads')
  .select('id, status')
  .eq('company_id', companyId);

const totalCalls = leads?.length || 0;
const totalMeetings = leads?.filter(l => l.status === 'Agendada').length || 0;
const conversionRate = (totalMeetings / totalCalls) * 100;

// SDRs Ativos
const { count: activeSdrs } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .eq('company_id', companyId)
  .eq('is_active', true)
  .eq('role', 'sdr');
```

**2. Chamadas por Dia**
```typescript
const { data: callsByDay } = await supabase
  .from('leads')
  .select('created_at, status')
  .eq('company_id', companyId)
  .gte('created_at', sevenDaysAgo);

// Agrupar e processar com date-fns
```

**3. Ranking com Badges**
```typescript
const { data: rankings } = await supabase
  .from('company_rankings')
  .select('*')
  .eq('company_id', companyId)
  .order('conversion_rate', { ascending: false });

// Adicione lógica para atribuir badges baseado em posição/métrica
```

### Hooks que você pode criar

```typescript
// src/hooks/useAdminStats.ts
export function useAdminStats(companyId: string) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Carrega todas as metrics
  }, [companyId]);

  return { stats, loading, error };
}

// src/hooks/useCallsChart.ts
export function useCallsChart(companyId: string, days: number = 7) {
  // Retorna dados formatados para Recharts
}
```

### Componentes Base (já existem, use como referência)
- `Card` - Para cardboxes
- `Button` - Para interações
- `Skeleton` - Para loading
- `BarChart` - Exemplo de Recharts (se tiver)

---

## 📦 Stack para FASE 2

| Biblioteca | Uso | Status |
|---|---|---|
| **Recharts** | Gráficos | ✅ Instalado |
| **date-fns** | Datas | ✅ Instalado |
| **React Query** | Cache/Refetch | ❌ Usar depois |
| **React Hooks** | Estado | ✅ Usar |
| **Supabase Client** | Queries | ✅ Usar |
| **Shadcn/UI** | Componentes | ✅ Usar |

---

## 🎨 Design Specs para Gráficos

### Colors
- **Primary:** Azul (para calls)
- **Secondary:** Verde (para reuniões/conversão)
- **Accent:** Laranja (para avisos/metas)
- **Grid:** Subtle (baixa opacidade)

### Responsive
- Desktop: Gráficos lado a lado
- Tablet: 1 gráfico por linha
- Mobile: Stack vertical, reduzir altura

---

## 📝 Arquivo de Exemplo - Como Estruturar

```typescript
// src/components/dashboard/admin/AdminMetricsCards.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminMetricsCardsProps {
  companyId: string;
}

export function AdminMetricsCards({ companyId }: AdminMetricsCardsProps) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Query 1: Total calls e meetings
        const { data: leads } = await supabase
          .from('leads')
          .select('status')
          .eq('company_id', companyId);

        const totalCalls = leads?.length || 0;
        const totalMeetings = leads?.filter(l => l.status === 'Agendada').length || 0;

        // Query 2: Active SDRs
        const { count: activeSdrs } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('is_active', true)
          .eq('role', 'sdr');

        setMetrics({
          totalCalls,
          totalMeetings,
          conversionRate: totalCalls > 0 ? ((totalMeetings / totalCalls) * 100).toFixed(1) : 0,
          activeSdrs: activeSdrs || 0,
        });
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [companyId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Calls Totais</p>
          <p className="text-3xl font-bold mt-2">{metrics?.totalCalls}</p>
        </CardContent>
      </Card>
      {/* ... outros cards */}
    </div>
  );
}
```

---

## 🧪 Testes para FASE 2

Após implementar, teste:
- [ ] Gráficos carregam dados reais
- [ ] Gráficos respondem a resizing
- [ ] Dados atualizam ao fazer refresh
- [ ] Loading states aparecem
- [ ] Erros são tratados (sem quebra)
- [ ] Mobile funciona bem (sem scroll horizontal)
- [ ] Performance: Carrega em < 2 segundos

---

## 📊 Prioridade de Componentes

1. **AdminMetricsCards** - Base para tudo
2. **CallsChart** - Mais visual impactante
3. **ConversionChart** - Mostra progresso
4. **Heatmap** - Nice to have
5. **Other charts** - Depois

---

## 🔗 Próximos Passos Após FASE 2

1. **FASE 3:** Gestão de Metas + Convites
2. **FASE 4:** Gamificação (Badges, Streaks, Weekly Ranking)
3. **FASE 5:** Melhorias (Tags, Real-time, Exports)

---

## 💡 Dicas para Implementação

- ✅ Comece com 1 gráfico simples
- ✅ Use `date-fns` para agrupar dados por data
- ✅ Teste queries no Supabase SQL Editor antes
- ✅ Faça components pequenos e reutilizáveis
- ✅ Adicione loading/error states desde o início
- ✅ Use TypeScript para type safety

---

## 🚀 Como Começar FASE 2 Hoje

1. **Copie estrutura** de exemplo acima
2. **Crie `AdminMetricsCards.tsx`** com dados reais
3. **Teste no `/admin`** para ver funcionando
4. **Incremente** com gráficos um por um
5. **Refatore** conforme padrões evoluem

---

**Tempo Estimado FASE 2:** 2-3 dias de desenvolvimento
**Próximo Review:** Quando metrics e 2-3 gráficos estiverem prontos

Boa sorte! 🚀
