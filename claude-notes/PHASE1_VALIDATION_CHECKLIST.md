# ✅ FASE 1 - Checklist de Validação

## 🧪 Testes de Funcionalidade

### Teste 1: Redirecionamento por Role ✓
- [ ] Faça login como **admin**
  - Esperado: Redireciona para `/admin`
  - Observar: URL muda para `http://localhost:3000/admin`

- [ ] Faça logout
- [ ] Faça login como **sdr**
  - Esperado: Redireciona para `/sdr`
  - Observar: URL muda para `http://localhost:3000/sdr`

### Teste 2: Proteção de Rotas ✓
- [ ] Login como **sdr**
- [ ] Tente acessar manualmente `http://localhost:3000/admin`
  - Esperado: Redireciona para `/sdr`
  - Não deve mostrar página de admin

- [ ] Login como **admin**
- [ ] Tente acessar manualmente `http://localhost:3000/sdr`
  - Esperado: Redireciona para `/admin`
  - Não deve mostrar página de sdr

### Teste 3: Admin Dashboard ✓
- [ ] Login como **admin**
- [ ] Você está em `/admin`?
  - Esperado: Sim
  
- [ ] Sidebar está visível com 4 menus?
  - Menu 1: Visão Geral (📊)
  - Menu 2: Equipe (👥)
  - Menu 3: Metas (🎯)
  - Menu 4: Configurações (⚙️)

- [ ] Clique em "Equipe"
  - Esperado: Vai para `/admin/team`

- [ ] Clique em "Metas"
  - Esperado: Vai para `/admin/goals`

### Teste 4: Admin Team Management ✓
- [ ] Login como **admin**
- [ ] Vá para `/admin/team`

- [ ] Tabela de SDRs está visível?
  - Esperado: Sim, com colunas (Nome, Email, Role, Status, Data, Ações)

- [ ] Dados reais são exibidos?
  - Esperado: Lista de SDRs da sua empresa
  - Dica: Compare com banco de dados Supabase

- [ ] Menu de ações funciona?
  - Clique em "..." (MoreHorizontal icon)
  - Esperado: Aparecem opções (Ver Histórico, Editar, Desativar)

- [ ] Botão "Convidar SDR" está visível?
  - Esperado: Sim (no topo direito)

### Teste 5: SDR Dashboard ✓
- [ ] Login como **sdr**
- [ ] Você está em `/sdr`?
  - Esperado: Sim

- [ ] Sidebar está visível com 4 menus?
  - Menu 1: Meu Dashboard (📊)
  - Menu 2: Histórico (📋)
  - Menu 3: Ranking (🏆)
  - Menu 4: Perfil (👤)

- [ ] 4 Cards com stats estão visíveis?
  - Card 1: Calls Hoje
  - Card 2: Reuniões Hoje
  - Card 3: Streak Atual
  - Card 4: Melhor Streak

- [ ] Stats carregam com dados reais?
  - Esperado: Números reais (não 0 necessariamente, depende dos dados)
  - Dica: Faça uma call e refresh para ver número aumentar

### Teste 6: SDR Histórico ✓
- [ ] Login como **sdr**
- [ ] Vá para `/sdr/history`

- [ ] Tabela de calls está visível?
  - Esperado: Sim, com colunas (Contato, Empresa, Status, Tags, Data)

- [ ] Dados reais aparecem?
  - Esperado: Se tiver calls registradas, aparecem aqui
  - Se vazio: É normal se não tem calls ainda

- [ ] Dados estão ordenados por data?
  - Esperado: Mais recente primeiro

### Teste 7: SDR Ranking ✓
- [ ] Login como **sdr**
- [ ] Vá para `/sdr/ranking`

- [ ] Card "Sua Posição" aparece?
  - Esperado: Sim, com seu número de calls e reuniões

- [ ] Ranking completo aparece?
  - Esperado: Sim, listando todos os SDRs
  - Com: Pódio (🥇🥈🥉), Nome, Calls, Reuniões, Taxa Conversão

- [ ] Sua posição está destacada?
  - Esperado: Sim (cor ou fundo diferente)

### Teste 8: SDR Profile ✓
- [ ] Login como **sdr**
- [ ] Vá para `/sdr/profile`

- [ ] Informações pessoais aparecem?
  - Nome, Email, Role

- [ ] Informações da empresa aparecem?
  - Nome da empresa, Data de criação

- [ ] Botões de ação aparecem?
  - "Editar Perfil" e "Alterar Senha"

### Teste 9: User Menu Logout ✓
- [ ] Em qualquer página, clique no user menu (canto superior direito)
  - Esperado: Dropdown com opções

- [ ] Clique em "Sair"
  - Esperado: Logout e volta para tela de login

- [ ] Tente acessar `/admin` ou `/sdr` manualmente
  - Esperado: Redireciona para login

### Teste 10: Sidebar Collapse (Mobile) ✓
- [ ] Redimensione o navegador para mobile (< 768px)
  - Ou abra DevTools com F12 e mude para modo mobile

- [ ] Sidebar deve colapsar automaticamente?
  - Esperado: Menu se torna ícones apenas

- [ ] Clique no ícone de menu (hamburger)
  - Esperado: Sidebar se expande/colapse

---

## 🔍 Testes de Dados

### Verificar Dados Admin
```sql
-- Verifique no Supabase SQL Editor:

-- Tabela de SDRs da sua empresa
SELECT id, full_name, email, role, is_active 
FROM profiles 
WHERE company_id = 'YOUR_COMPANY_ID';

-- Total de calls da empresa
SELECT COUNT(*) as total_calls 
FROM leads 
WHERE company_id = 'YOUR_COMPANY_ID';
```

### Verificar Dados SDR
```sql
-- Calls do SDR
SELECT * FROM leads 
WHERE sdr_id = 'SDR_USER_ID' 
ORDER BY created_at DESC;

-- Streak do SDR
SELECT current_streak, max_streak 
FROM user_streaks 
WHERE user_id = 'SDR_USER_ID';

-- Ranking da empresa
SELECT * FROM company_rankings 
WHERE company_id = 'COMPANY_ID' 
ORDER BY conversion_rate DESC;
```

---

## 🐛 Problemas Comuns e Soluções

### Problema: "Página em branco"
**Solução:**
1. Abra DevTools (F12)
2. Veja a aba "Console"
3. Procure por erros em vermelho
4. Reporte o erro aqui

### Problema: "Não consigo fazer login"
**Solução:**
1. Verifique se `.env` tem as credenciais Supabase
2. Tente criar uma nova conta (Sign Up)
3. Se ainda não funcionar, verifique Supabase Dashboard

### Problema: "Fui redirecionado pro lugar errado"
**Solução:**
1. Verifique sua role no banco:
   ```sql
   SELECT role FROM profiles WHERE id = 'YOUR_USER_ID';
   ```
2. Se role = 'admin', deve ir para `/admin`
3. Se role = 'sdr', deve ir para `/sdr`
4. Se outro valor, contate desenvolvedor

### Problema: "Dados não aparecem na tabela"
**Solução:**
1. Verifique se existem registros no banco
2. Abra DevTools > Network > Veja requisições Supabase
3. Verifique se não há erros de permission (403)
4. Se tiver erro 403, problema é RLS policy

### Problema: "Sidebar não funciona em mobile"
**Solução:**
1. Abra DevTools em modo mobile (F12)
2. Redimensione para ~375px de largura
3. Menu deve aparecer como ícones
4. Clique no hamburger para expandir

---

## ✅ Checklist Final de Validação

- [ ] Redirecionamento por role funciona
- [ ] Proteção de rotas funciona
- [ ] Admin vê lista de SDRs com dados reais
- [ ] SDR vê stats em tempo real
- [ ] SDR vê histórico de calls
- [ ] SDR vê ranking com posição
- [ ] Logout funciona em todas as páginas
- [ ] Sidebar funciona em mobile
- [ ] Nenhum erro no console (F12)
- [ ] Nenhum erro TypeScript na build

---

## 🚀 Próximas Etapas Após Validação

Se todos os testes passarem ✅

**Próximo:** FASE 2 - Gráficos e Dashboards

1. Leia `PHASE2_ROADMAP.md`
2. Crie `AdminMetricsCards.tsx`
3. Integre gráficos com Recharts
4. Teste em `/admin`

---

## 📞 Se Precisar de Ajuda

1. Consulte os arquivos de documentação:
   - `QUICKSTART_GUIDE.md` - Como testar
   - `RESTRUCTURING_PLAN.md` - Arquitetura
   - `PHASE1_IMPLEMENTATION.md` - Detalhes técnicos

2. Verifique o browser console (F12)
3. Verifique os logs do servidor

---

**Data de Teste:** 29 de Maio de 2026
**Versão:** FASE 1 - Final
**Status:** Pronto para validação completa

```
Total de testes: 10 principais + testes de dados
Tempo estimado: 15-20 minutos
Resultado esperado: ✅ TUDO FUNCIONA
```
