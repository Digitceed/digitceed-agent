"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function excerpt(content, length = 140) {
  const plain = content
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

export default function KnowledgeBase({ articles }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.category || "").toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }, [articles, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const article of filtered) {
      const category = article.category || "Overig";
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(article);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-8">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek in de kennisbank..."
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
      />

      {grouped.length === 0 && (
        <p className="text-sm text-gray-400">Geen artikelen gevonden.</p>
      )}

      {grouped.map(([category, items]) => (
        <div key={category}>
          <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-3">
            {category}
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((article) => (
              <Link
                key={article.id}
                href={`/kennisbank/${article.id}`}
                className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="font-medium">{article.title}</div>
                <div className="text-sm text-gray-400 mt-1">{excerpt(article.content)}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
