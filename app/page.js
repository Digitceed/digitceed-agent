import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCrmAdminClient, isActiveEmployee } from "@/lib/crm-admin";
import Chat from "@/components/Chat";

export const metadata = {
  title: "Digitceed Agent",
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const crmAdmin = createCrmAdminClient();
  if (!crmAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white">
        CRM niet geconfigureerd.
      </div>
    );
  }

  const allowed = await isActiveEmployee(crmAdmin, user.id);
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white text-center px-6">
        Je account heeft geen toegang tot de Digitceed Agent.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-20">
        <h1 className="text-3xl font-bold mb-8">Digitceed Agent</h1>
        <Chat />
      </div>
    </div>
  );
}
