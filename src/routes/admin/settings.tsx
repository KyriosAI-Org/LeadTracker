import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProfile } from "@/lib/profile-context";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Building2, UserCog, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Settings() {
  const { profile, refresh } = useProfile();
  const companyId = profile?.company_id;

  const { data, isLoading } = useQuery({
    queryKey: ["settings", companyId],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: company }, { data: userData }] = await Promise.all([
        supabase.from("companies").select("name").eq("id", companyId!).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      return { companyName: company?.name ?? "", email: userData.user?.email ?? "" };
    },
  });

  // Company form
  const [companyName, setCompanyName] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  // Account form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  // Password form
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (data) { setCompanyName(data.companyName); setEmail(data.email); }
  }, [data]);
  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
  }, [profile]);

  const saveCompany = async () => {
    if (!companyName.trim()) return toast.error("Informe o nome da empresa.");
    setSavingCompany(true);
    const { error } = await supabase.from("companies").update({ name: companyName.trim() }).eq("id", companyId!);
    setSavingCompany(false);
    error ? toast.error(error.message) : toast.success("Empresa atualizada");
  };

  const saveAccount = async () => {
    setSavingAccount(true);
    const { error: pErr } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", profile!.id);
    let emailErr = null;
    if (email.trim() && email.trim() !== data?.email) {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      emailErr = error;
    }
    setSavingAccount(false);
    if (pErr || emailErr) return toast.error((pErr ?? emailErr)!.message);
    toast.success(email.trim() !== data?.email ? "Dados salvos. Confirme o novo e-mail na sua caixa de entrada." : "Dados salvos");
    refresh();
  };

  const savePassword = async () => {
    if (password.length < 6) return toast.error("A senha precisa de ao menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) return toast.error(error.message);
    setPassword(""); setConfirm("");
    toast.success("Senha alterada");
  };

  return (
    <AdminLayout userProfile={profile}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie sua empresa e sua conta</p>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <section className="bg-card border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Empresa</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Nome da empresa</Label>
                <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <Button size="sm" className="gap-2" onClick={saveCompany} disabled={savingCompany}>
                {savingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </Button>
            </section>

            <section className="bg-card border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Minha conta</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button size="sm" className="gap-2" onClick={saveAccount} disabled={savingAccount}>
                {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar dados
              </Button>

              <div className="border-t pt-4 mt-4 space-y-4">
                <p className="text-sm font-medium">Alterar senha</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pass">Nova senha</Label>
                    <Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={savePassword} disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Alterar senha
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <RoleGuard requiredRole="admin" fallbackPath="/sdr">
      <Settings />
    </RoleGuard>
  ),
});
