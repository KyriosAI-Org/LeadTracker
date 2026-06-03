import { createFileRoute } from "@tanstack/react-router";
import { SDRLayout } from "@/components/layouts/SDRLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProfile } from "@/lib/profile-context";
import { LeadForm } from "@/components/leads/LeadForm";

function NewCall() {
  const { profile } = useProfile();

  return (
    <SDRLayout userProfile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar Call</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Preencha o resultado da cold call. Dica: <kbd className="px-1.5 py-0.5 rounded border bg-muted text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded border bg-muted text-xs">Enter</kbd> salva.
          </p>
        </div>

        <LeadForm />
      </div>
    </SDRLayout>
  );
}

export const Route = createFileRoute("/sdr/new")({
  component: () => (
    <RoleGuard requiredRole="sdr" fallbackPath="/admin">
      <NewCall />
    </RoleGuard>
  ),
});
