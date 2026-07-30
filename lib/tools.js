export const ALLOWED_TABLES = [
  "tickets",
  "invoices",
  "contracts",
  "deals",
  "tasks",
  "quotes",
  "workflows",
  "lists",
];

export function validateTable(table) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table "${table}" is not allowed. Allowed: ${ALLOWED_TABLES.join(", ")}`);
  }
  return table;
}

const MAX_ROWS = 20;

export async function listRecords(crm, table, status) {
  validateTable(table);
  let query = crm.from(table).select("*");
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(MAX_ROWS);
  if (error) throw new Error(`Kon "${table}" niet ophalen: ${error.message}`);
  return data;
}

// Splits a free-text query into words and builds an OR-across-words,
// OR-across-fields filter — matching any word in any field. A plain
// whole-phrase ILIKE misses hits like query "onboarding nieuwe medewerker"
// against a shorter field value like category "Onboarding", since the full
// phrase never occurs as a substring there.
function wordMatchFilter(query, fields) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const terms = words.length > 0 ? words : [query];
  return terms
    .flatMap((word) => fields.map((field) => `${field}.ilike.%${word}%`))
    .join(",");
}

export async function searchContacts(crm, query) {
  const { data, error } = await crm
    .from("contacts")
    .select("*")
    .or(wordMatchFilter(query, ["name", "company", "email"]))
    .limit(10);
  if (error) throw new Error(`Kon contacten niet doorzoeken: ${error.message}`);
  return data;
}

export async function getContact(crm, id) {
  const { data, error } = await crm.from("contacts").select("*").eq("id", id).single();
  if (error) throw new Error(`Kon contact niet ophalen: ${error.message}`);
  return data;
}

export async function searchKnowledgeArticles(crm, query) {
  const { data, error } = await crm
    .from("knowledge_articles")
    .select("*")
    .or(wordMatchFilter(query, ["title", "category", "content"]))
    .limit(5);
  if (error) throw new Error(`Kon kennisbank niet doorzoeken: ${error.message}`);
  return data;
}

export async function listKnowledgeArticles(crm) {
  const { data, error } = await crm
    .from("knowledge_articles")
    .select("id, title, category, content, created_at")
    .eq("status", "published")
    .order("category", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw new Error(`Kon kennisbank niet ophalen: ${error.message}`);
  return data;
}

export async function getKnowledgeArticle(crm, id) {
  const { data, error } = await crm
    .from("knowledge_articles")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();
  if (error) throw new Error(`Kon artikel niet ophalen: ${error.message}`);
  return data;
}
