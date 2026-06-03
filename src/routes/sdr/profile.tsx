import { createFileRoute } from "@tanstack/react-router";
import { SDRLayout } from "@/components/layouts/SDRLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/auth-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const prof = await getUserProfile();
      setProfile(prof);

      if (prof?.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("*")
          .eq("id", prof.company_id)
          .maybeSingle();

        setCompany(comp);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <SDRLayout userProfile={profile}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Informações pessoais e configurações
          </p>
        </div>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Nome Completo</label>
              <p className="text-lg font-medium">{profile?.full_name || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-lg font-medium">{profile?.email || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <p className="text-lg font-medium capitalize">{profile?.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Nome da Empresa</label>
              <p className="text-lg font-medium">{company?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Data de Criação</label>
              <p className="text-lg font-medium">
                {company?.created_at
                  ? new Date(company.created_at).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline">Editar Perfil</Button>
          <Button variant="outline" className="text-red-600">
            Alterar Senha
          </Button>
        </div>
      </div>
    </SDRLayout>
  );
}

export const Route = createFileRoute("/sdr/profile")({
  component: () => (
    <RoleGuard requiredRole="sdr" fallbackPath="/admin">
      <ProfilePage />
    </RoleGuard>
  ),
});
