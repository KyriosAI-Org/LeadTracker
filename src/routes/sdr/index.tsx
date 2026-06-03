import { createFileRoute, Link } from "@tanstack/react-router";
import { SDRLayout } from "@/components/layouts/SDRLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProfile } from "@/lib/profile-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PhoneCall, ArrowRight, Phone, CalendarCheck, Flame, Trophy } from "lucide-react";
import { eachDayOfInterval, subDays, isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = {
  primary: "#4f46e5",
  green: "#22c55e",
  amber: "#f59e0b",
  slate: "#94a3b8",
};

type Lead = {
  id: string;
  company: string;
  status: string;
  created_at: string | null;
  scheduled_at: string | null;
  performance_rating: number | null;
};

function SDRDashboard() {
  const { profile } = useProfile();
  const sdrId = profile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["sdr-dashboard", sdrId],
    enabled: !!sdrId,
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: leads }, { data: streak }] = await Promise.all([
        supabase
          .from("leads")
          .select("id, company, status, created_at, scheduled_at, performance_rating")
          .eq("sdr_id", sdrId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_streaks")
          .select("current_streak, max_streak")
          .eq("user_id", sdrId!)
          .maybeSingle(),
      ]);

      const all = (leads ?? []) as Lead[];
      const today = new Date();

      const isMeeting = (l: Lead) => l.status === "Agendada";
      const isAnswered = (l: Lead) => l.status === "Agendada" || l.status === "Não Agendou";

      const todays = all.filter((l) => l.created_at && isSameDay(new Date(l.created_at), today));

      // Série de 14 dias
      const days = eachDayOfInterval({ start: subDays(today, 13), end: today });
      const series = days.map((day) => {
        const dayLeads = all.filter((l) => l.created_at && isSameDay(new Date(l.created_at), day));
        return {
          label: format(day, "dd/MM", { locale: ptBR }),
          calls: dayLeads.length,
          meetings: dayLeads.filter(isMeeting).length,
        };
      });

      // Funil / breakdown
      const total = all.length;
      const answered = all.filter(isAnswered).length;
      const meetings = all.filter(isMeeting).length;
      const noAnswer = all.filter((l) => l.status === "Não Atendeu").length;
      const notScheduled = all.filter((l) => l.status === "Não Agendou").length;

      const conversion = answered > 0 ? Math.round((meetings / answered) * 100) : 0;
      const contactRate = total > 0 ? Math.round((answered / total) * 100) : 0;

      const breakdown = [
        { name: "Agendada", value: meetings, color: COLORS.green },
        { name: "Não Agendou", value: notScheduled, color: COLORS.amber },
        { name: "Não Atendeu", value: noAnswer, color: COLORS.slate },
      ].filter((s) => s.value > 0);

      return {
        todaysCalls: todays.length,
        todaysMeetings: todays.filter(isMeeting).length,
        currentStreak: streak?.current_streak ?? 0,
        maxStreak: streak?.max_streak ?? 0,
        series,
        total, answered, meetings, conversion, contactRate,
        breakdown,
        recent: all.slice(0, 8),
      };
    },
  });

  const cards = [
    { label: "Calls Hoje", value: data?.todaysCalls ?? 0, icon: Phone, tint: "text-primary" },
    { label: "Reuniões Hoje", value: data?.todaysMeetings ?? 0, icon: CalendarCheck, tint: "text-green-600" },
    { label: "Streak Atual", value: `${data?.currentStreak ?? 0}d`, icon: Flame, tint: "text-orange-500" },
    { label: "Melhor Streak", value: `${data?.maxStreak ?? 0}d`, icon: Trophy, tint: "text-amber-500" },
  ];

  return (
    <SDRLayout userProfile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seu Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe seu desempenho em tempo real</p>
        </div>

        {/* CTA primária */}
        <Link
          to="/sdr/new"
          className="group flex items-center justify-between gap-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold">Registrar nova call</p>
              <p className="text-sm text-primary-foreground/80">Lance o resultado da sua cold call em segundos</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-card border rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <c.icon className={`w-4 h-4 ${c.tint}`} />
              </div>
              <p className="text-3xl font-bold">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Evolução de calls */}
          <div className="bg-card border rounded-xl p-6 lg:col-span-2">
            <h2 className="text-base font-semibold mb-1">Evolução de Calls</h2>
            <p className="text-xs text-muted-foreground mb-4">Últimos 14 dias</p>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data?.series} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMeet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="calls" name="Calls" stroke={COLORS.primary} strokeWidth={2} fill="url(#gCalls)" />
                  <Area type="monotone" dataKey="meetings" name="Reuniões" stroke={COLORS.green} strokeWidth={2} fill="url(#gMeet)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Taxa de conversão / funil */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-base font-semibold mb-1">Taxa de Conversão</h2>
            <p className="text-xs text-muted-foreground mb-4">Sobre calls atendidas</p>
            {isLoading ? (
              <ChartSkeleton />
            ) : !data || data.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados ainda.</p>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={data.breakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {data.breakdown.map((s) => <Cell key={s.name} fill={s.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold">{data.conversion}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">conversão</span>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <FunnelRow label="Total de calls" value={data.total} />
                  <FunnelRow label="Atendidas" value={data.answered} hint={`${data.contactRate}%`} />
                  <FunnelRow label="Reuniões" value={data.meetings} hint={`${data.conversion}%`} accent />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chamadas recentes */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Chamadas Recentes</h2>
            <Link to="/sdr/history" className="text-xs font-medium text-primary hover:underline">Ver tudo</Link>
          </div>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !data?.recent.length ? (
            <div className="text-muted-foreground text-sm text-center py-8">
              Nenhuma chamada registrada ainda. <Link to="/sdr/new" className="text-primary hover:underline">Registrar a primeira</Link>.
            </div>
          ) : (
            <div className="divide-y">
              {data.recent.map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2.5">
                  <StatusDot status={l.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.company || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.created_at ? format(new Date(l.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : "—"}
                    </p>
                  </div>
                  {l.performance_rating != null && (
                    <span className="text-xs text-muted-foreground shrink-0">{l.performance_rating}/10</span>
                  )}
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SDRLayout>
  );
}

function FunnelRow({ label, value, hint, accent }: { label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={accent ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className="flex items-center gap-2">
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        <span className={`font-semibold tabular-nums ${accent ? "text-green-600" : ""}`}>{value}</span>
      </span>
    </div>
  );
}

const STATUS_STYLE: Record<string, { dot: string; badge: string }> = {
  "Agendada": { dot: "bg-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" },
  "Não Agendou": { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  "Não Atendeu": { dot: "bg-slate-400", badge: "bg-muted text-muted-foreground" },
};

function StatusDot({ status }: { status: string }) {
  return <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_STYLE[status]?.dot ?? "bg-primary"}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLE[status]?.badge ?? "bg-primary/10 text-primary";
  return <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${cls}`}>{status}</span>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[160px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
}

export const Route = createFileRoute("/sdr/")({
  component: () => (
    <RoleGuard requiredRole="sdr" fallbackPath="/admin">
      <SDRDashboard />
    </RoleGuard>
  ),
});
