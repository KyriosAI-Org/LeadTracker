import { Card, CardContent } from "@/components/ui/card";
import { Phone, CalendarCheck, Target, XCircle, Zap, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    total: number;
    scheduled: number;
    lost: number;
    conversion: string;
    avgCallsPerMeeting: string;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const items = [
    { 
      label: "Calls da Empresa", 
      val: stats.total, 
      sub: "LIGAÇÕES TOTAIS", 
      icon: Phone, 
      color: "text-primary", 
      bg: "bg-primary/5",
      trend: "Estável",
      trendIcon: Zap
    },
    { 
      label: "Reuniões Marcadas", 
      val: stats.scheduled, 
      sub: "AGENDAMENTOS", 
      icon: CalendarCheck, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      trend: "+12%",
      trendIcon: TrendingUp
    },
    { 
      label: "Conversão Geral", 
      val: `${stats.conversion}%`, 
      sub: "CONVERSÃO", 
      icon: Target, 
      color: "text-blue-600", 
      bg: "bg-blue-50 dark:bg-blue-950/20",
      trend: "Ideal > 15%",
      trendIcon: Zap
    },
    { 
      label: "Oportunidades", 
      val: stats.lost, 
      sub: "DESCARTE", 
      icon: XCircle, 
      color: "text-rose-600", 
      bg: "bg-rose-50 dark:bg-rose-950/20",
      trend: "Normal",
      trendIcon: Zap
    },
    { 
      label: "Eficiência Equipe", 
      val: stats.avgCallsPerMeeting, 
      sub: "CALLS / REU", 
      icon: Zap, 
      color: "text-amber-600", 
      bg: "bg-amber-50 dark:bg-amber-950/20",
      trend: "Meta: < 8",
      trendIcon: TrendingDown
    },
  ];


  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
      {items.map((item, idx) => (
        <Card key={idx} className={`border border-border/50 shadow-sm bg-card/50 backdrop-blur-xl rounded-2xl transition-all hover:shadow-md ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{item.label}</span>
              <div className={`p-2.5 rounded-xl ${item.bg}`}>
                <item.icon className={`h-4 h-4 ${item.color}`} />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums text-foreground">{item.val}</div>
              <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-tight">{item.sub}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <item.trendIcon className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[10px] font-bold text-muted-foreground/60">{item.trend}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
