-- Funil de cold call: status passa a refletir Atendeu/Agendou.
-- Valores antigos ('scheduled'/'not_scheduled') eram incompatíveis com a view
-- company_rankings (que conta 'Agendada'), então o schema já estava inconsistente.

-- 1) Migra dados existentes para o novo vocabulário.
UPDATE public.leads SET status = 'Agendada'    WHERE status = 'scheduled';
UPDATE public.leads SET status = 'Não Agendou' WHERE status = 'not_scheduled';
UPDATE public.leads SET status = 'Não Agendou' WHERE status = 'Perdida';

-- 2) Troca a constraint para os três estados do funil.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('Agendada', 'Não Agendou', 'Não Atendeu'));
