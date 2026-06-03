import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, ArrowRight, Plus, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Login form
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [sdrEmails, setSdrEmails] = useState([""]);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          setSession(session);
          if (session) await checkProfile(session);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkProfile = async (session: any) => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!prof || !prof.company_id) {
      const userEmail = session.user.email;
      const { data: invite } = userEmail
        ? await supabase
            .from("company_invites")
            .select("*")
            .eq("email", userEmail)
            .eq("used", false)
            .maybeSingle()
        : { data: null };

      if (invite) {
        const { error: linkErr } = await supabase.from("profiles").upsert({
          id: session.user.id,
          company_id: invite.company_id,
          full_name: session.user.email?.split("@")[0],
          role: invite.role,
        });
        if (!linkErr) {
          await supabase.from("company_invites").update({ used: true }).eq("id", invite.id);
          window.location.reload();
          return;
        }
      }
      setNeedsOnboarding(true);
    } else {
      setProfile(prof);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);

    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail.");
      }
    } catch (err: any) {
      const msg = err.message?.includes("Invalid login credentials")
        ? "E-mail ou senha incorretos."
        : err.message?.includes("already registered")
        ? "Este e-mail já está cadastrado."
        : err.message ?? "Ocorreu um erro.";
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !adminName.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setOnboardingLoading(true);

    try {
      // Ensure session is fresh and attached to the client
      const { data: { session: currentSession }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !currentSession) {
        toast.error("Sessão expirada. Faça login novamente.");
        setOnboardingLoading(false);
        return;
      }
      await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      });

      const { data: company, error: compErr } = await supabase
        .from("companies")
        .insert({ name: companyName.trim() })
        .select()
        .single();
      if (compErr) throw compErr;

      const { error: profErr } = await supabase.from("profiles").upsert({
        id: session.user.id,
        company_id: company.id,
        full_name: adminName.trim(),
        role: "admin",
      });
      if (profErr) throw profErr;

      await Promise.all([
        supabase.from("targets").insert({
          company_id: company.id,
          daily_calls_target: 50,
          weekly_meetings_target: 5,
        }),
        supabase.rpc("setup_default_achievements", { company_uuid: company.id }),
      ]);

      const validEmails = sdrEmails.filter((e) => e.trim() !== "");
      if (validEmails.length > 0) {
        await Promise.all(
          validEmails.map((email) =>
            supabase.from("company_invites").insert({
              company_id: company.id,
              email: email.trim(),
              role: "sdr",
              token: Math.random().toString(36).substring(2),
            })
          )
        );
      }

      toast.success("Empresa configurada!");
      setNeedsOnboarding(false);
      window.location.reload();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.15_250)_0%,transparent_60%)] opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.35_0.12_250)_0%,transparent_60%)] opacity-60" />

          <div className="relative z-10">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-white leading-tight">
                Gerencie sua<br />equipe de vendas
              </h2>
              <p className="text-primary-foreground/70 text-base leading-relaxed max-w-sm">
                Acompanhe métricas, metas e performance dos seus SDRs em tempo real.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {["Painel de performance individual", "Ranking e gamificação", "Gestão de leads e agendamentos"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-primary-foreground/40">
            Kyrios Tracker © {new Date().getFullYear()}
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {authMode === "signin" ? "Bem-vindo de volta" : "Criar conta"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {authMode === "signin"
                  ? "Entre com suas credenciais para continuar"
                  : "Preencha seus dados para começar"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  E-mail
                </Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={authLoading}
                className="w-full h-11 font-semibold"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {authMode === "signin" ? "Entrar" : "Criar conta"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground">
              {authMode === "signin" ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                className="text-primary font-medium hover:underline underline-offset-2 transition-all"
              >
                {authMode === "signin" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (session && needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Configurar empresa</h1>
              <p className="text-xs text-muted-foreground">Passo {onboardingStep} de 2</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5">
            <div className="flex-1 h-1 rounded-full bg-primary" />
            <div className={`flex-1 h-1 rounded-full transition-colors ${onboardingStep === 2 ? "bg-primary" : "bg-muted"}`} />
          </div>

          <form onSubmit={onboardingStep === 1 ? (e) => { e.preventDefault(); setOnboardingStep(2); } : handleOnboarding}
            className="space-y-4 bg-card border border-border/50 rounded-2xl p-6"
          >
            {onboardingStep === 1 ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nome da empresa
                  </Label>
                  <Input
                    placeholder="Ex: Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="h-11 bg-muted/50 border-border/60"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Seu nome completo
                  </Label>
                  <Input
                    placeholder="Nome do administrador"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    className="h-11 bg-muted/50 border-border/60"
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold mt-2">
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Convidar SDRs (opcional)
                    </Label>
                    <button
                      type="button"
                      onClick={() => setSdrEmails([...sdrEmails, ""])}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sdrEmails.map((email, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          type="email"
                          placeholder={`email.sdr${idx + 1}@empresa.com`}
                          value={email}
                          onChange={(e) => {
                            const updated = [...sdrEmails];
                            updated[idx] = e.target.value;
                            setSdrEmails(updated);
                          }}
                          className="h-10 bg-muted/50 border-border/60 text-sm"
                        />
                        {sdrEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSdrEmails(sdrEmails.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOnboardingStep(1)}
                    className="h-11 px-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={onboardingLoading}
                    className="flex-1 h-11 font-semibold"
                  >
                    {onboardingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Finalizar configuração"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>

          <p className="text-xs text-center text-muted-foreground/60">
            Logado como {session.user.email} •{" "}
            <button
              onClick={() => supabase.auth.signOut()}
              className="hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Sair
            </button>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
