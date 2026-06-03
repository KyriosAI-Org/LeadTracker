import { createFileRoute } from "@tanstack/react-router";
import { TeamManagement } from "@/components/auth/TeamManagement";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Gestão de Equipe | LeadTrack" },
      { name: "description", content: "Gerencie sua equipe comercial e acompanhe o desempenho dos SDRs." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  return <TeamManagement />;
}
