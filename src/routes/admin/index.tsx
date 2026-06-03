import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProfile } from "@/lib/profile-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, CalendarCheck, TrendingUp, Users, Loader2, Trophy } from "lucide-react";

type Ranking = {
  sdr_id: string | null;
  full_name: string | null;
  total_calls: number | null;
  total_meetings: number | null;
  conversion_rate: number | null;
};

function AdminDashboard() {
  const { profile } = useProfile();
  const companyId = profile?.company_id;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview", companyId],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: rankings }, { data: people }] = await Promise.all([
        supabase
          .from("company_rankings")
          .select("sdr_id, full_name, total_calls, total_meetings, conversion_rate")
          .eq("company_id", companyId!),
        supabase
          .from("profiles")
          .select("id, role, is_active")
          .eq("company_id", companyId!),
      ]);

      const rows = (rankings ?? []) as Ranking[];
      const totalCalls = rows.reduce((s, r) => s + (r.total_calls ?? 0), 0);
      const totalMeetings = rows.reduce((s, r) => s + (r.total_meetings ?? 0), 0);
      const activeSdrs = (people ?? []).filter((p: any) => p.role === "sdr" && p.is_active !== false).length;
      const conversion = totalCalls > 0 ? Math.round((totalMeetings / totalCalls) * 100) : 0;

      const ranking = [...rows].sort(
        (a, b) => (b.total_meetings ?? 0) - (a.total_meetings ?? 0) || (b.total_calls ?? 0) - (a.total_calls ?? 0),
      );

      return { totalCalls, totalMeetings, conversion, activeSdrs, ranking };
    },
  });

  const cards = [
    { title: "Calls Totais", value: data?.totalCalls ?? 0, icon: Phone },
    { title: "Reuniões", value: data?.totalMeetings ?? 0, icon: CalendarCheck },
    { title: "Taxa Conversão", value: `${data?.conversion ?? 0}%`, icon: TrendingUp },
    { title: "SDRs Ativos", value: data?.activeSdrs ?? 0, icon: Users },
  ];

  return (
    <AdminLayout userProfile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo, {profile?.full_name || "Admin"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.title} className="bg-card border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <card.icon className="w-4 h-4 text-primary/60" />
              </div>
              <p className="text-3xl font-bold">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">Ranking de SDRs</h2>
          </div>

          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !data?.ranking.length ? (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados de desempenho ainda.</p>
          ) : (
            <div className="divide-y">
              {data.ranking.map((r, i) => (
                <div key={r.sdr_id ?? i} className="flex items-center gap-4 py-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{r.total_calls ?? 0} calls · {r.total_meetings ?? 0} reuniões</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{Math.round(r.conversion_rate ?? 0)}%</p>
                    <p className="text-xs text-muted-foreground">conversão</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export const Route = createFileRoute("/admin/")({
  component: () => (
    <RoleGuard requiredRole="admin" fallbackPath="/sdr">
      <AdminDashboard />
    </RoleGuard>
  ),
});
