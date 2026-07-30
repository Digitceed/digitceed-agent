import { createClient } from "@supabase/supabase-js";

/**
 * Server-only CRM client using the service role key. Bypasses RLS —
 * never import this in client components.
 *
 * Used both for the employee-access check and for the agent's data tools.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 *   null when the env vars are not configured.
 */
export function createCrmAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * True if the given auth user id belongs to an active employee.
 */
export async function isActiveEmployee(crmAdmin, authUserId) {
  const { data, error } = await crmAdmin
    .from("employees")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(`Kon employee-status niet checken: ${error.message}`);
  return Boolean(data);
}
