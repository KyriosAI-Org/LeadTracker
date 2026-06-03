import { supabase } from "@/integrations/supabase/client";

/** Returns the current access token, or throws if there is no active session. */
export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  return token;
}
