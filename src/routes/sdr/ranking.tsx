import { createFileRoute } from "@tanstack/react-router";
import { SDRLayout } from "@/components/layouts/SDRLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/auth-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

function RankingPage() {
  const [profile, setProfile] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [userPosition, setUserPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const prof = await getUserProfile();
      setProfile(prof);

      if (!prof?.company_id) {
        setLoading(false);
        return;
      }

      // Get ranking from the view
      const { data: rankingData } = await supabase
        .from("company_rankings")
        .select("*")
        .eq("company_id", prof.company_id)
        .order("conversion_rate", { ascending: false });

      setRanking(rankingData || []);

      // Find user's position
      const userRank = rankingData?.find((r) => r.sdr_id === prof.id);
      setUserPosition(userRank);

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
          <h1 className="text-3xl font-bold tracking-tight">Ranking da Equipe</h1>
          <p className="text-muted-foreground mt-2">
            Veja sua posição na equipe
          </p>
        </div>

        {/* User's Position */}
        {userPosition && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Sua Posição</p>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {ranking.findIndex((r) => r.sdr_id === userPosition.sdr_id) + 1}º
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calls</p>
                <p className="text-2xl font-bold">{userPosition.total_calls}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reuniões</p>
                <p className="text-2xl font-bold">{userPosition.total_meetings}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversão</p>
                <p className="text-2xl font-bold">{userPosition.conversion_rate?.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Ranking */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Ranking Completo</h2>
          <div className="space-y-3">
            {ranking.map((sdr, idx) => (
              <div
                key={sdr.sdr_id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  sdr.sdr_id === profile?.id
                    ? "bg-primary/5 border-primary/20"
                    : "bg-background/50 border-border"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                  </div>
                  <div>
                    <p className="font-medium">{sdr.full_name}</p>
                    <p className="text-xs text-muted-foreground">{sdr.total_calls} calls</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{sdr.conversion_rate?.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{sdr.total_meetings} reuniões</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SDRLayout>
  );
}

export const Route = createFileRoute("/sdr/ranking")({
  component: () => (
    <RoleGuard requiredRole="sdr" fallbackPath="/admin">
      <RankingPage />
    </RoleGuard>
  ),
});
