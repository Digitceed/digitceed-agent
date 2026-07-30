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

export async function searchContacts(crm, query) {
  const pattern = `%${query}%`;
  const { data, error } = await crm
    .from("contacts")
    .select("*")
    .or(`name.ilike.${pattern},company.ilike.${pattern},email.ilike.${pattern}`)
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
  const pattern = `%${query}%`;
  const { data, error } = await crm
    .from("knowledge_articles")
    .select("*")
    .or(`title.ilike.${pattern},category.ilike.${pattern},content.ilike.${pattern}`)
    .limit(5);
  if (error) throw new Error(`Kon kennisbank niet doorzoeken: ${error.message}`);
  return data;
}
