import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "sdr";

/**
 * Get the current user's role
 * Returns null if not authenticated or no profile found
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Get the current user's company ID
 * Returns null if not authenticated or not assigned to a company
 */
export async function getUserCompanyId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.company_id || null;
  } catch (error) {
    console.error("Error getting user company id:", error);
    return null;
  }
}

/**
 * Get full profile data
 */
export async function getUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return profile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

/**
 * Check if user is SDR
 */
export async function isUserSDR(): Promise<boolean> {
  const role = await getUserRole();
  return role === "sdr";
}

/**
 * Check if user is active
 */
export async function isUserActive(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.is_active !== false;
  } catch (error) {
    console.error("Error checking user status:", error);
    return false;
  }
}

/**
 * Ensure user has a role-specific layout redirect
 * Used in route guards
 */
export function getRoleBasedPath(role: UserRole | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "sdr":
      return "/sdr";
    default:
      return "/auth/login";
  }
}
