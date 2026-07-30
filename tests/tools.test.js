import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateTable,
  ALLOWED_TABLES,
  listRecords,
  searchContacts,
  getContact,
  searchKnowledgeArticles,
  listKnowledgeArticles,
  getKnowledgeArticle,
} from "../lib/tools.js";

test("validateTable accepts every whitelisted table", () => {
  for (const table of ALLOWED_TABLES) {
    assert.equal(validateTable(table), table);
  }
});

test("validateTable rejects a table not on the whitelist", () => {
  assert.throws(() => validateTable("profiles"), /not allowed/i);
});

test("validateTable rejects SQL-injection-style input", () => {
  assert.throws(() => validateTable("tickets; drop table tickets;--"), /not allowed/i);
});

function makeMockCrm(rows) {
  const calls = [];
  const builder = {
    select(...args) { calls.push(["select", args]); return builder; },
    or(...args) { calls.push(["or", args]); return builder; },
    eq(...args) { calls.push(["eq", args]); return builder; },
    order(...args) { calls.push(["order", args]); return builder; },
    limit(...args) { calls.push(["limit", args]); return builder; },
    single() { return Promise.resolve({ data: rows[0] ?? null, error: null }); },
    // Real Supabase query builders are thenable at any point in the chain
    // (no explicit terminal method required) — mirror that here.
    then(resolve) { resolve({ data: rows, error: null }); },
  };
  return { from(table) { calls.push(["from", [table]]); return builder; }, calls };
}

test("listRecords queries the requested table, ordered and limited", async () => {
  const crm = makeMockCrm([{ id: "1" }]);
  const rows = await listRecords(crm, "tickets");
  assert.deepEqual(rows, [{ id: "1" }]);
  assert.deepEqual(crm.calls[0], ["from", ["tickets"]]);
  assert.equal(crm.calls.some(([name]) => name === "limit"), true);
});

test("listRecords applies a status filter when given one", async () => {
  const crm = makeMockCrm([]);
  await listRecords(crm, "tickets", "open");
  assert.deepEqual(crm.calls.find(([name]) => name === "eq"), ["eq", ["status", "open"]]);
});

test("listRecords rejects a non-whitelisted table before touching the client", async () => {
  const crm = makeMockCrm([]);
  await assert.rejects(() => listRecords(crm, "profiles"), /not allowed/i);
  assert.equal(crm.calls.length, 0);
});

test("searchContacts searches name, company, and email", async () => {
  const crm = makeMockCrm([{ id: "c1", name: "Jan" }]);
  const rows = await searchContacts(crm, "jan");
  assert.deepEqual(rows, [{ id: "c1", name: "Jan" }]);
  const orCall = crm.calls.find(([name]) => name === "or");
  assert.ok(orCall[1][0].includes("jan"));
});

test("getContact fetches a single contact by id", async () => {
  const crm = makeMockCrm([{ id: "c1", name: "Jan" }]);
  const contact = await getContact(crm, "c1");
  assert.deepEqual(contact, { id: "c1", name: "Jan" });
  assert.deepEqual(crm.calls.find(([name]) => name === "eq"), ["eq", ["id", "c1"]]);
});

test("searchKnowledgeArticles searches title, category, and content", async () => {
  const crm = makeMockCrm([{ id: "k1", title: "npm install via Plesk" }]);
  const rows = await searchKnowledgeArticles(crm, "plesk");
  assert.deepEqual(rows, [{ id: "k1", title: "npm install via Plesk" }]);
  assert.deepEqual(crm.calls[0], ["from", ["knowledge_articles"]]);
});

test("searchKnowledgeArticles matches on any single word from a multi-word query", async () => {
  const crm = makeMockCrm([{ id: "k1", category: "Onboarding" }]);
  await searchKnowledgeArticles(crm, "onboarding nieuwe medewerker");
  const orCall = crm.calls.find(([name]) => name === "or");
  assert.ok(orCall[1][0].includes("category.ilike.%onboarding%"));
  assert.ok(orCall[1][0].includes("category.ilike.%nieuwe%"));
  assert.ok(orCall[1][0].includes("category.ilike.%medewerker%"));
});

test("searchContacts matches on any single word from a multi-word query", async () => {
  const crm = makeMockCrm([{ id: "c1", name: "Jan" }]);
  await searchContacts(crm, "Jan de Vries");
  const orCall = crm.calls.find(([name]) => name === "or");
  assert.ok(orCall[1][0].includes("name.ilike.%Jan%"));
  assert.ok(orCall[1][0].includes("name.ilike.%Vries%"));
});

test("listKnowledgeArticles returns only published articles, ordered by category then title", async () => {
  const crm = makeMockCrm([{ id: "k1", title: "A", category: "Onboarding" }]);
  const rows = await listKnowledgeArticles(crm);
  assert.deepEqual(rows, [{ id: "k1", title: "A", category: "Onboarding" }]);
  assert.deepEqual(crm.calls.find(([name]) => name === "eq"), ["eq", ["status", "published"]]);
  const orderCalls = crm.calls.filter(([name]) => name === "order");
  assert.deepEqual(orderCalls[0], ["order", ["category", { ascending: true }]]);
  assert.deepEqual(orderCalls[1], ["order", ["title", { ascending: true }]]);
});

test("getKnowledgeArticle fetches a single published article by id", async () => {
  const crm = makeMockCrm([{ id: "k1", title: "A" }]);
  const article = await getKnowledgeArticle(crm, "k1");
  assert.deepEqual(article, { id: "k1", title: "A" });
  const eqCalls = crm.calls.filter(([name]) => name === "eq").map(([, args]) => args);
  assert.deepEqual(eqCalls, [["id", "k1"], ["status", "published"]]);
});
