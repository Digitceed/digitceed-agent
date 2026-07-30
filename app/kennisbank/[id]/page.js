import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { requireEmployee } from "@/lib/require-employee";
import { getKnowledgeArticle } from "@/lib/tools";

const MARKDOWN_STYLES =
  "text-gray-200 leading-relaxed " +
  "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3 " +
  "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 " +
  "[&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 " +
  "[&_strong]:font-semibold [&_strong]:text-white " +
  "[&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm";

export default async function KnowledgeArticlePage({ params }) {
  const { id } = await params;

  const result = await requireEmployee();
  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white text-center px-6">
        {result.error}
      </div>
    );
  }

  let article;
  try {
    article = await getKnowledgeArticle(result.crmAdmin, id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-20">
        <Link href="/kennisbank" className="text-sm text-gray-400 hover:text-white">
          ← Terug naar kennisbank
        </Link>
        <div className="mt-6 mb-2 text-sm uppercase tracking-wide text-gray-400">
          {article.category}
        </div>
        <h1 className="text-3xl font-bold mb-8">{article.title}</h1>
        <article className={MARKDOWN_STYLES}>
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
