// Motivos quando a pessoa ATENDEU mas não agendou (objeções reais).
export const OBJECTION_REASONS = [
  "Sem interesse",
  "Já possui solução",
  "Sem orçamento",
  "Decisor ausente",
  "Pediu retorno",
  "Sem fit / perfil",
  "Achou caro",
  "Outro motivo",
] as const;

// Motivos quando a pessoa NÃO ATENDEU (sem contato real).
export const NO_ANSWER_REASONS = [
  "Não atendeu",
  "Caixa postal",
  "Número inválido",
  "Ocupado",
  "Caiu na secretária",
  "Desligou na hora",
] as const;

// Mantido como alias para compatibilidade com imports antigos.
export const REJECTION_REASONS = OBJECTION_REASONS;

export type ObjectionReason = typeof OBJECTION_REASONS[number];
export type NoAnswerReason = typeof NO_ANSWER_REASONS[number];

// IMPORTANT: estes valores são persistidos em leads.status e a view
// `company_rankings` conta reunião via `status = 'Agendada'`. Mantenha em
// sincronia com o banco (e com get_sdr_stats).
//   - Agendada:    atendeu E agendou reunião  (conversão)
//   - Não Agendou: atendeu, mas não agendou   (contato sem conversão)
//   - Não Atendeu: não houve contato
export const STATUS_OPTIONS = {
  SCHEDULED: "Agendada",
  NOT_SCHEDULED: "Não Agendou",
  NO_ANSWER: "Não Atendeu",
} as const;

export type LeadStatus = typeof STATUS_OPTIONS[keyof typeof STATUS_OPTIONS];
