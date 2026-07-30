import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCrmAdminClient, isActiveEmployee } from "@/lib/crm-admin";

/**
 * Server-component auth gate: redirects to /login if not authenticated,
 * otherwise returns either { error } (CRM misconfigured / not an active
 * employee) or { user, crmAdmin } for the page to use.
 */
export async function requireEmployee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const crmAdmin = createCrmAdminClient();
  if (!crmAdmin) {
    return { error: "CRM niet geconfigureerd." };
  }

  const allowed = await isActiveEmployee(crmAdmin, user.id);
  if (!allowed) {
    return { error: "Je account heeft geen toegang tot de Digitceed Agent." };
  }

  return { user, crmAdmin };
}
