import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/lib/profile-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadTracker | Cold Call CRM" },
      { name: "description", content: "Registro rápido e categorização de leads para cold calls." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    if (profile.role === "admin") navigate({ to: "/admin" });
    else if (profile.role === "sdr") navigate({ to: "/sdr" });
  }, [loading, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  return null;
}
