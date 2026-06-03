import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProfile } from "@/lib/profile-context";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Target, Save, Phone, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TargetForm = { daily: string; weekly: string };
const empty: TargetForm = { daily: "", weekly: "" };

async function saveTarget(companyId: string, userId: string | null, form: TargetForm) {
  const daily = form.daily === "" ? null : Number(form.daily);
  const weekly = form.weekly === "" ? null : Number(form.weekly);

  let query = supabase.from("targets").select("id").eq("company_id", companyId);
  query = userId ? query.eq("user_id", userId) : query.is("user_id", null);
  const { data: existing } = await query.maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("targets")
      .update({ daily_calls_target: daily, weekly_meetings_target: weekly })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("targets")
      .insert({ company_id: companyId, user_id: userId, daily_calls_target: daily, weekly_meetings_target: weekly });
    if (error) throw new Error(error.message);
  }
}

function GoalsManagement() {
  const { profile } = useProfile();
  const companyId = profile?.company_id;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["targets", companyId],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: targets }, { data: sdrs }] = await Promise.all([
        supabase.from("targets").select("user_id, daily_calls_target, weekly_meetings_target").eq("company_id", companyId!),
        supabase.from("profiles").select("id, full_name, role").eq("company_id", companyId!).eq("role", "sdr"),
      ]);
      return { targets: targets ?? [], sdrs: sdrs ?? [] };
    },
  });

  // Local editable forms: "company" key + one per SDR id.
  const [forms, setForms] = useState<Record<string, TargetForm>>({});
  useEffect(() => {
    if (!data) return;
    const next: Record<string, TargetForm> = {};
    const companyT = data.targets.find((t: any) => t.user_id === null);
    next.company = {
      daily: companyT?.daily_calls_target?.toString() ?? "",
      weekly: companyT?.weekly_meetings_target?.toString() ?? "",
    };
    for (const sdr of data.sdrs as any[]) {
      const t = data.targets.find((x: any) => x.user_id === sdr.id);
      next[sdr.id] = {
        daily: t?.daily_calls_target?.toString() ?? "",
        weekly: t?.weekly_meetings_target?.toString() ?? "",
      };
    }
    setForms(next);
  }, [data]);

  const mut = useMutation({
    mutationFn: async ({ userId, form }: { userId: string | null; form: TargetForm }) =>
      saveTarget(companyId!, userId, form),
    onSuccess: () => { toast.success("Meta salva"); qc.invalidateQueries({ queryKey: ["targets", companyId] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar meta"),
  });

  const update = (key: string, field: keyof TargetForm, value: string) =>
    setForms((f) => ({ ...f, [key]: { ...(f[key] ?? empty), [field]: value.replace(/[^0-9]/g, "") } }));

  return (
    <AdminLayout userProfile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
          <p className="text-muted-foreground text-sm mt-1">Defina a meta padrão da equipe e ajustes individuais por SDR</p>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Company default */}
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Meta padrão da empresa</h2>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">Aplicada a todos os SDRs que não tiverem meta individual.</p>
              <TargetFields
                form={forms.company ?? empty}
                onChange={(field, v) => update("company", field, v)}
                onSave={() => mut.mutate({ userId: null, form: forms.company ?? empty })}
                saving={mut.isPending && mut.variables?.userId === null}
              />
            </div>

            {/* Per-SDR */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-base font-semibold">Metas individuais</h2>
              </div>
              {!data?.sdrs.length ? (
                <p className="p-10 text-center text-muted-foreground text-sm">Nenhum SDR cadastrado ainda.</p>
              ) : (
                <div className="divide-y">
                  {(data.sdrs as any[]).map((sdr) => (
                    <div key={sdr.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-end gap-4">
                      <div className="sm:w-48">
                        <p className="font-medium text-sm">{sdr.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">SDR</p>
                      </div>
                      <div className="flex-1">
                        <TargetFields
                          form={forms[sdr.id] ?? empty}
                          onChange={(field, v) => update(sdr.id, field, v)}
                          onSave={() => mut.mutate({ userId: sdr.id, form: forms[sdr.id] ?? empty })}
                          saving={mut.isPending && mut.variables?.userId === sdr.id}
                          compact
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function TargetFields({ form, onChange, onSave, saving, compact }: {
  form: TargetForm;
  onChange: (field: keyof TargetForm, value: string) => void;
  onSave: () => void;
  saving: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        {!compact && <Label className="flex items-center gap-1.5 text-xs"><Phone className="w-3.5 h-3.5" /> Calls / dia</Label>}
        <Input
          inputMode="numeric"
          className="w-28"
          placeholder={compact ? "Calls/dia" : "0"}
          value={form.daily}
          onChange={(e) => onChange("daily", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        {!compact && <Label className="flex items-center gap-1.5 text-xs"><CalendarCheck className="w-3.5 h-3.5" /> Reuniões / semana</Label>}
        <Input
          inputMode="numeric"
          className="w-32"
          placeholder={compact ? "Reuniões/sem" : "0"}
          value={form.weekly}
          onChange={(e) => onChange("weekly", e.target.value)}
        />
      </div>
      <Button size="sm" variant="outline" className="gap-2" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar
      </Button>
    </div>
  );
}

export const Route = createFileRoute("/admin/goals")({
  component: () => (
    <RoleGuard requiredRole="admin" fallbackPath="/sdr">
      <GoalsManagement />
    </RoleGuard>
  ),
});
