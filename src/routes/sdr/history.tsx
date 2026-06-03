import { createFileRoute } from "@tanstack/react-router";
import { SDRLayout } from "@/components/layouts/SDRLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/auth-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function CallHistory() {
  const [profile, setProfile] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const prof = await getUserProfile();
      setProfile(prof);

      if (!prof?.id) {
        setLoading(false);
        return;
      }

      const { data: leadsList } = await supabase
        .from("leads")
        .select("*")
        .eq("sdr_id", prof.id)
        .order("created_at", { ascending: false });

      setLeads(leadsList || []);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Calls</h1>
          <p className="text-muted-foreground mt-2">
            Visualize todas as suas chamadas registradas
          </p>
        </div>

        <div className="bg-card border rounded-lg overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhuma chamada registrada ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-center">Nota</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.company || "-"}</TableCell>
                    <TableCell><StatusBadge status={lead.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.rejection_reason || "-"}</TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {lead.performance_rating != null ? `${lead.performance_rating}/10` : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.tags?.length > 0 ? lead.tags.join(", ") : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </SDRLayout>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    "Agendada": "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    "Não Agendou": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    "Não Atendeu": "bg-muted text-muted-foreground",
  };
  const cls = (status && map[status]) || "bg-primary/10 text-primary";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status || "-"}
    </span>
  );
}

export const Route = createFileRoute("/sdr/history")({
  component: () => (
    <RoleGuard requiredRole="sdr" fallbackPath="/admin">
      <CallHistory />
    </RoleGuard>
  ),
});
