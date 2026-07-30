import Link from "next/link";
import { requireEmployee } from "@/lib/require-employee";
import { listKnowledgeArticles } from "@/lib/tools";
import KnowledgeBase from "@/components/KnowledgeBase";

export const metadata = {
  title: "Kennisbank — Digitceed Agent",
  robots: { index: false, follow: false },
};

export default async function KnowledgeBasePage() {
  const result = await requireEmployee();
  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white text-center px-6">
        {result.error}
      </div>
    );
  }

  const articles = await listKnowledgeArticles(result.crmAdmin);

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-4xl px-6 pt-20 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Kennisbank</h1>
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Terug naar chat
          </Link>
        </div>
        <KnowledgeBase articles={articles} />
      </div>
    </div>
  );
}
