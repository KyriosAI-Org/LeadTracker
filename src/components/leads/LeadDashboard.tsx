import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  Star, 
  Clock,
  PieChart as PieChartIcon,
  Loader2,
  Zap,
  Calendar,
  Filter,
  RefreshCcw,
  Rocket,
  Users,
  Trophy,
  Target as TargetIcon,
  BarChart2,
  Medal,
  Flame,
  Award
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Cell
} from 'recharts';
import { format, subDays, isSameDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { STATUS_OPTIONS } from "@/lib/constants";
import { DashboardStats } from "./DashboardStats";
import { LeadTable } from "./LeadTable";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database['public']['Tables']['leads']['Row'];

export function LeadDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [targets, setTargets] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("*, companies(*)")
        .eq("id", user.id)
        .single();
      
      if (prof) {
        setProfile(prof);
        
        const [leadsRes, targetsRes, streakRes, achievementsRes] = await Promise.all([
          supabase.from("leads").select("*, profiles:sdr_id(full_name)").eq("company_id", prof.company_id as string).order("created_at", { ascending: false }),
          supabase.from("targets").select("*").eq("company_id", prof.company_id as string).maybeSingle(),
          supabase.from("user_streaks").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", user.id)
        ]);

        if (leadsRes.error) throw leadsRes.error;
        setLeads(leadsRes.data || []);
        setTargets(targetsRes.data);
        setStreak(streakRes.data);
        setAchievements(achievementsRes.data || []);
      }
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast.error("Erro ao carregar dados: " + (error.message || "Erro de conexão"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success("Registro removido");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }, []);

  const stats = useMemo(() => {
    const isSDR = profile?.role !== 'admin';
    const personalLeads = isSDR ? leads.filter(l => l.sdr_id === profile?.id) : leads;

    const total = personalLeads.length;
    const scheduled = personalLeads.filter((l) => l.status === STATUS_OPTIONS.SCHEDULED).length;
    const lost = total - scheduled;
    const conversion = total > 0 ? ((scheduled / total) * 100).toFixed(1) : "0";
    const avgCallsPerMeeting = scheduled > 0 ? (total / scheduled).toFixed(1) : "0";
    
    const today = new Date();
    const callsToday = personalLeads.filter(l => l.created_at && isSameDay(new Date(l.created_at), today)).length;
    const meetingsToday = personalLeads.filter(l => l.created_at && isSameDay(new Date(l.created_at), today) && l.status === STATUS_OPTIONS.SCHEDULED).length;
    const conversionToday = callsToday > 0 ? ((meetingsToday / callsToday) * 100).toFixed(1) : "0";

    const rejections = leads
      .filter(l => l.status === STATUS_OPTIONS.NOT_SCHEDULED && l.rejection_reason)
      .reduce((acc: Record<string, number>, l) => {
        const reason = l.rejection_reason as string;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

    const rejectionData = Object.entries(rejections)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), i);
      const dayLeads = personalLeads.filter(l => l.created_at && isSameDay(new Date(l.created_at), date));
      return {
        date: format(date, 'dd/MM', { locale: ptBR }),
        calls: dayLeads.length,
        meetings: dayLeads.filter(l => l.status === STATUS_OPTIONS.SCHEDULED).length,
      };
    }).reverse();

    const hourly = personalLeads.reduce((acc: Record<number, any>, l) => {
      if (!l.created_at) return acc;
      const hour = new Date(l.created_at).getHours();
      if (!acc[hour]) acc[hour] = { hour, calls: 0, scheduled: 0 };
      acc[hour].calls++;
      if (l.status === STATUS_OPTIONS.SCHEDULED) acc[hour].scheduled++;
      return acc;
    }, {});

    const bestHour = Object.values(hourly).sort((a: any, b: any) => {
      const rateA = a.scheduled / a.calls;
      const rateB = b.scheduled / b.calls;
      return rateB - rateA;
    })[0];

    const sdrPerformance = leads.reduce((acc: any, lead: any) => {
      const sdrId = lead.sdr_id || 'unassigned';
      const sdrName = (lead as any).profiles?.full_name || 'SDR Desconhecido';
      
      if (!acc[sdrId]) {
        acc[sdrId] = { id: sdrId, name: sdrName, calls: 0, scheduled: 0, meetingsThisMonth: 0 };
      }
      
      acc[sdrId].calls++;
      if (lead.status === STATUS_OPTIONS.SCHEDULED) {
        acc[sdrId].scheduled++;
        if (lead.created_at && new Date(lead.created_at) >= startOfMonth(new Date())) {
          acc[sdrId].meetingsThisMonth++;
        }
      }
      return acc;
    }, {});

    const rankingData = Object.values(sdrPerformance)
      .map((sdr: any) => ({
        ...sdr,
        conversion: sdr.calls > 0 ? ((sdr.scheduled / sdr.calls) * 100).toFixed(1) : "0"
      }))
      .sort((a: any, b: any) => b.scheduled - a.scheduled);

    const sdrOfMonth = rankingData.length > 0 ? rankingData.sort((a, b) => b.meetingsThisMonth - a.meetingsThisMonth)[0] : null;

    return {
      total,
      scheduled,
      lost,
      conversion,
      avgCallsPerMeeting,
      rejectionData,
      last7Days,
      bestHour,
      rankingData,
      callsToday,
      meetingsToday,
      conversionToday,
      sdrOfMonth
    };
  }, [leads]);

  const exportCSV = useCallback(() => {
    const headers = ["Empresa", "Telefone", "Status", "Motivo", "Data Reunião", "Sua Nota", "Notas", "Data Registro"];
    const csvData = leads.map(l => [
      l.company,
      l.phone || "",
      l.status === STATUS_OPTIONS.SCHEDULED ? "Agendada" : "Não Agendada",
      l.rejection_reason || "-",
      l.scheduled_at ? format(new Date(l.scheduled_at), 'dd/MM/yyyy HH:mm') : "-",
      l.performance_rating || "-",
      (l.notes || "").replace(/,/g, ';'),
      l.created_at ? format(new Date(l.created_at), 'dd/MM/yyyy HH:mm') : "-"
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [leads]);

  if (loading && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-4 animate-pulse">Carregando Inteligência...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 animate-in fade-in duration-700 pb-24">
      <div className="max-w-[1400px] mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Button variant="outline" size="icon" asChild className="rounded-xl h-12 w-12 border-border/50 hover:bg-muted transition-all shadow-sm">
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/logo.png" alt="LeadTracker Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {profile?.role === 'admin' ? 'Painel Comercial' : 'Minha Performance'}
                </h1>
              </div>
              <p className="text-muted-foreground/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <RefreshCcw className="w-3 h-3 text-primary animate-spin-slow" />
                Live Insights • {profile?.companies?.name || 'LeadTrack Enterprise'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {profile?.role === 'admin' && (
              <Button variant="outline" size="lg" asChild className="rounded-xl border-border/50 font-bold h-12 px-6 text-xs uppercase tracking-wider hover:bg-muted transition-all">
                <Link to="/team">
                  <Users className="w-4 h-4 mr-2" />
                  Equipe
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={exportCSV} className="rounded-xl border-border/50 font-bold h-12 px-6 text-xs uppercase tracking-wider hover:bg-muted transition-all">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="lg" asChild className="rounded-xl shadow-lg shadow-primary/20 font-bold h-12 px-8 text-xs uppercase tracking-wider bg-primary hover:opacity-90 transition-all">
              <Link to="/">Nova Call</Link>
            </Button>
          </div>
        </header>

        <DashboardStats stats={stats} />

        {/* Real-time Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-primary">Calls Hoje</span>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{stats.callsToday}</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Reuniões Hoje</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold">{stats.meetingsToday}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-amber-600">Conversão Hoje</span>
                <TargetIcon className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold">{stats.conversionToday}%</div>
            </CardContent>
          </Card>
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-purple-600">SDR do Mês</span>
                <Trophy className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-sm font-bold truncate">{stats.sdrOfMonth?.name || "Aguardando..."}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border border-border/50 shadow-sm bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-6 px-8 pt-8 border-b border-border/50">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Atividade Semanal</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">Acompanhamento das últimas 7 sessões.</CardDescription>
              </div>
              <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pt-8 px-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.last7Days}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: 'oklch(var(--muted-foreground))'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: 'oklch(var(--muted-foreground))'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid oklch(var(--border))', background: 'oklch(var(--card))', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    labelStyle={{fontWeight: 700, marginBottom: '4px', fontSize: '12px'}}
                    itemStyle={{fontWeight: 600, fontSize: '11px'}}
                  />
                  <Area type="monotone" dataKey="calls" name="Ligações" stroke="oklch(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                  <Area type="monotone" dataKey="meetings" name="Reuniões" stroke="oklch(var(--primary))" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorMeetings)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SDR Ranking Card */}
          <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 px-8 pt-8 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Ranking de SDRs</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">Top performers da empresa.</CardDescription>
              </div>
              <Medal className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent className="pt-8 px-8 space-y-4">
              {stats.rankingData.slice(0, 5).map((sdr, idx) => (
                <div key={sdr.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/30 bg-background/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? "bg-amber-500 text-white" : idx === 1 ? "bg-slate-300 text-slate-700" : idx === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{sdr.name}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">{sdr.scheduled} reuniões • {sdr.conversion}% conv.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-primary">{sdr.calls}</div>
                    <div className="text-[8px] text-muted-foreground/40 font-bold uppercase">Calls</div>
                  </div>
                </div>
              ))}
              {stats.rankingData.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <Users className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sem dados de equipe</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goals & Gamification Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-6 px-8 pt-8 border-b border-border/50">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Metas e Progresso</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">Acompanhamento operacional.</CardDescription>
              </div>
              <TargetIcon className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chamadas Diárias</span>
                  <span className="text-sm font-bold">{stats.callsToday} / {targets?.daily_calls_target || 50}</span>
                </div>
                <Progress value={(stats.callsToday / (targets?.daily_calls_target || 50)) * 100} className="h-3" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reuniões Semanais</span>
                  <span className="text-sm font-bold">{stats.scheduled} / {targets?.weekly_meetings_target || 5}</span>
                </div>
                <Progress value={(stats.scheduled / (targets?.weekly_meetings_target || 5)) * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-6 px-8 pt-8 border-b border-border/50">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Gamificação & Conquistas</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">Medalhas e streaks conquistados.</CardDescription>
              </div>
              <Award className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary/5 p-4 rounded-2xl flex items-center gap-4 border border-primary/10">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Flame className="w-6 h-6 text-primary-foreground animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-primary/60">Streak Atual</span>
                    <div className="text-2xl font-black">{streak?.current_streak || 0} Dias</div>
                  </div>
                </div>
                <div className="bg-amber-500/5 p-4 rounded-2xl flex items-center gap-4 border border-amber-500/10">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-600/60">Medalhas</span>
                    <div className="text-2xl font-black">{achievements.length}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-4">Últimas Conquistas</p>
                <div className="flex flex-wrap gap-3">
                  {achievements.slice(0, 4).map((ua: any) => (
                    <div key={ua.id} className="p-2 bg-muted rounded-xl border border-border/50 flex items-center gap-2 group cursor-help" title={ua.achievements.description}>
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{ua.achievements.name}</span>
                    </div>
                  ))}
                  {achievements.length === 0 && (
                    <div className="text-xs font-medium text-muted-foreground/60 italic">Continue prospectando para ganhar medalhas!</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <LeadTable leads={profile?.role === 'admin' ? leads : leads.filter(l => l.sdr_id === profile?.id)} onDelete={handleDelete} />
      </div>
    </div>
  );
}
