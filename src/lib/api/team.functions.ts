import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Admin-only team management. All credential operations (create user, change
// e-mail / password, delete) require the service_role key, which lives ONLY on
// the server (see client.server.ts). Each call is guarded by requireAdmin():
// the client passes its Supabase access token, we validate it server-side and
// confirm the caller is an active admin before touching anything.

const TeamMember = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  role: z.enum(["admin", "sdr"]),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
});

type AdminCtx = { id: string; company_id: string };

/** Validates the access token and confirms the caller is an active admin. */
async function requireAdmin(accessToken: string): Promise<AdminCtx> {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Sessão inválida. Faça login novamente.");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, company_id, is_active")
    .eq("id", data.user.id)
    .maybeSingle<{ id: string; role: string; company_id: string | null; is_active: boolean | null }>();

  if (!profile) throw new Error("Perfil não encontrado.");
  if (profile.role !== "admin") throw new Error("Apenas administradores podem gerenciar a equipe.");
  if (profile.is_active === false) throw new Error("Conta de administrador desativada.");
  if (!profile.company_id) throw new Error("Administrador sem empresa associada.");

  return { id: profile.id, company_id: profile.company_id };
}

/** Lists every member of the admin's company, joined with their auth e-mail. */
export const getTeam = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.accessToken);

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("company_id", admin.company_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    // is_active is not in the generated types yet — fetch it untyped.
    const { data: actives } = await supabaseAdmin
      .from("profiles")
      .select("id, is_active")
      .eq("company_id", admin.company_id);
    const activeMap = new Map((actives ?? []).map((r: any) => [r.id, r.is_active]));

    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((usersList?.users ?? []).map((u) => [u.id, u.email ?? null]));

    const members = (profiles ?? []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailMap.get(p.id) ?? null,
      role: p.role,
      is_active: activeMap.get(p.id) !== false,
      created_at: p.created_at,
    }));

    return z.array(TeamMember).parse(members);
  });

/** Creates a new SDR (auth user + profile) inside the admin's company. */
export const createSdr = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      fullName: z.string().trim().min(1, "Informe o nome."),
      email: z.string().trim().email("E-mail inválido."),
      password: z.string().min(6, "A senha precisa de ao menos 6 caracteres."),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.accessToken);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Não foi possível criar o usuário.");
    }

    // Upsert handles both: profile auto-created by a trigger, or not.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: created.user.id,
          full_name: data.fullName,
          role: "sdr",
          company_id: admin.company_id,
          is_active: true,
        } as any,
        { onConflict: "id" },
      );
    if (profileError) {
      // Roll back the auth user so we don't leave an orphan.
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileError.message);
    }

    return { id: created.user.id };
  });

/** Updates an SDR's name / role (profile) and/or e-mail / password (auth). */
export const updateSdr = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      userId: z.string().min(1),
      fullName: z.string().trim().min(1).optional(),
      role: z.enum(["admin", "sdr"]).optional(),
      email: z.string().trim().email("E-mail inválido.").optional(),
      password: z.string().min(6, "A senha precisa de ao menos 6 caracteres.").optional().or(z.literal("")),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.accessToken);
    await assertSameCompany(data.userId, admin.company_id);

    // Auth-side changes (e-mail / password).
    const authPatch: Record<string, unknown> = {};
    if (data.email) authPatch.email = data.email;
    if (data.password) authPatch.password = data.password;
    if (Object.keys(authPatch).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, authPatch);
      if (error) throw new Error(error.message);
    }

    // Profile-side changes (name / role).
    const profilePatch: Record<string, unknown> = {};
    if (data.fullName) profilePatch.full_name = data.fullName;
    if (data.role) profilePatch.role = data.role;
    if (Object.keys(profilePatch).length > 0) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(profilePatch as any)
        .eq("id", data.userId);
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

/** Activates / deactivates an SDR (profile flag + auth ban so login is blocked). */
export const setSdrActive = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      userId: z.string().min(1),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.accessToken);
    if (data.userId === admin.id) throw new Error("Você não pode desativar a si mesmo.");
    await assertSameCompany(data.userId, admin.company_id);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: data.isActive } as any)
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    // Block / unblock the actual login session.
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.isActive ? "none" : "876000h", // ~100 years
    } as any);

    return { ok: true };
  });

/** Permanently removes an SDR (auth user + profile). */
export const deleteSdr = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1), userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.accessToken);
    if (data.userId === admin.id) throw new Error("Você não pode remover a si mesmo.");
    await assertSameCompany(data.userId, admin.company_id);

    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Guards against an admin touching a profile outside their own company. */
async function assertSameCompany(userId: string, companyId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle<{ company_id: string | null }>();
  if (!data || data.company_id !== companyId) {
    throw new Error("Usuário não pertence à sua empresa.");
  }
}
