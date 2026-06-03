import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Trash2,
  Loader2,
  ArrowLeft,
  Trophy,
  Activity,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { STATUS_OPTIONS } from "@/lib/constants";

interface Member {
  id: string;
  full_name: string | null;
  role: "admin" | "sdr";
  company_id: string | null;
}

interface SDRStats {
  id: string;
  name: string;
  calls: number;
  meetings: number;
  conversion: number;
}

export function TeamManagement() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: prof } = await supabase
          .from("profiles")
          .select("*, companies(*)")
          .eq("id", user.id)
          .single();

        if (prof?.company_id) {
          setProfile(prof);
          const [teamRes, leadsRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("company_id", prof.company_id),
            supabase.from("leads").select("sdr_id, status").eq("company_id", prof.company_id),
          ]);
          setMembers((teamRes.data as Member[]) || []);
          setLeads(leadsRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sdrStats = useMemo<SDRStats[]>(() => {
    return members
      .filter((m) => m.role === "sdr")
      .map((m) => {
        const own = leads.filter((l) => l.sdr_id === m.id);
        const calls = own.length;
        const meetings = own.filter((l) => l.status === STATUS_OPTIONS.SCHEDULED).length;
        return {
          id: m.id,
          name: m.full_name || "SDR",
          calls,
          meetings,
          conversion: calls > 0 ? Math.round((meetings / calls) * 100) : 0,
        };
      })
      .sort((a, b) => b.meetings - a.meetings);
  }, [members, leads]);

  const topThree = sdrStats.slice(0, 3);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const token = Math.random().toString(36).substring(2);
      const { error } = await supabase.from("company_invites").insert({
        company_id: profile.company_id,
        email: inviteEmail.trim(),
        role: "sdr",
        token,
      });

      if (error) throw error;

      toast.success("Convite enviado para " + inviteEmail);
      setInviteEmail("");
    } catch (error: any) {
      toast.error("Erro ao convidar: " + error.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl h-12 w-12 border-border/50 hover:bg-muted transition-all">
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Gestão de Equipe
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Gerencie seus SDRs e acompanhe o desempenho coletivo.</p>
          </div>
        </header>

        {/* Comparativo entre SDRs (dados reais) */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Comparativo de Performance
              </CardTitle>
              <CardDescription>Calls e reuniões marcadas por SDR.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pt-6">
            {sdrStats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 gap-2">
                <Users className="w-10 h-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Sem SDRs cadastrados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sdrStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "oklch(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: "oklch(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid oklch(var(--border))", background: "oklch(var(--card))" }}
                    labelStyle={{ fontWeight: 700, fontSize: 12 }}
                    itemStyle={{ fontWeight: 600, fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                  <Bar dataKey="calls" name="Calls" fill="oklch(var(--primary))" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="meetings" name="Reuniões" fill="oklch(var(--primary) / 0.45)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-xl">Membros da Equipe</CardTitle>
              <CardDescription>Lista de SDRs e Administradores registrados na sua empresa.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {members.map((member) => {
                  const stats = sdrStats.find((s) => s.id === member.id);
                  return (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {member.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                            {member.role === "admin" ? <Shield className="w-3 h-3 text-amber-500" /> : <Activity className="w-3 h-3 text-blue-500" />}
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {stats && (
                          <div className="text-right">
                            <div className="text-xs font-black text-primary">{stats.meetings} reuniões</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase">{stats.calls} calls • {stats.conversion}%</div>
                          </div>
                        )}
                        {profile?.role === "admin" && member.id !== profile.id && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5 rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Convidar SDR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold">Email do SDR</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="sdr@empresa.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="rounded-xl border-border/50"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl font-bold gap-2" disabled={inviting}>
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Enviar Convite
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Top 3 da Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Performers reais</p>
                <div className="space-y-3">
                  {topThree.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sem dados ainda.</p>
                  ) : (
                    topThree.map((sdr, i) => (
                      <div key={sdr.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-amber-700"}`}>#0{i + 1}</span>
                          <span className="text-xs font-bold truncate max-w-[110px]">{sdr.name}</span>
                        </div>
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {sdr.meetings} reuniões
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
