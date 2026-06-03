import { createFileRoute } from "@tanstack/react-router";
import { LeadDashboard } from "@/components/leads/LeadDashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | LeadTrack" },
      { name: "description", content: "Visualização de métricas e performance de prospecção." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return <LeadDashboard />;
}
