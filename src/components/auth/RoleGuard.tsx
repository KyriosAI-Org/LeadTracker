import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import type { UserRole } from "@/lib/auth-helpers";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallbackPath?: string;
}

export function RoleGuard({ children, requiredRole = ["admin", "sdr"], fallbackPath = "/" }: RoleGuardProps) {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!profile || profile.is_active === false) { navigate({ to: "/" }); return; }
    const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!required.includes(profile.role as UserRole)) navigate({ to: fallbackPath });
  }, [loading, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!profile) return null;

  return <>{children}</>;
}
