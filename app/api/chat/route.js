import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createCrmAdminClient, isActiveEmployee } from "@/lib/crm-admin";
import {
  ALLOWED_TABLES,
  searchContacts,
  getContact,
  listRecords,
  searchKnowledgeArticles,
} from "@/lib/tools";

const SYSTEM_PROMPT = `Je bent de interne assistent van digitceed, een marketing- en webbureau.
Je beantwoordt twee soorten vragen van medewerkers:
1. Procedures/how-to (bijv. "hoe maak ik een factuur in de CRM", "hoe doe ik npm install via Plesk") — zoek dit op met search_knowledge_articles.
2. Live CRM-data (klanten, tickets, facturen, contracten, deals, taken, offertes, workflows, lijsten) — gebruik search_contacts, get_contact of list_records.
Antwoord in het Nederlands, kort en concreet. Als je iets niet kunt vinden, zeg dat eerlijk in plaats van te gokken.`;

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const crm = createCrmAdminClient();
  if (!crm) {
    return NextResponse.json({ error: "CRM not configured" }, { status: 500 });
  }

  const allowed = await isActiveEmployee(crm, user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Agent not configured" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const schema = z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })
      )
      .min(1),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tools = [
    betaZodTool({
      name: "search_contacts",
      description: "Zoek een klant/contact op naam, bedrijf of e-mail.",
      inputSchema: z.object({ query: z.string().describe("Zoekterm: naam, bedrijf of e-mail") }),
      run: async ({ query }) => {
        try {
          return JSON.stringify(await searchContacts(crm, query));
        } catch (err) {
          return `Fout: ${err.message}`;
        }
      },
    }),
    betaZodTool({
      name: "get_contact",
      description: "Haal het volledige klantbeeld van één contact op (contact-UUID vereist).",
      inputSchema: z.object({ id: z.string().describe("Contact UUID") }),
      run: async ({ id }) => {
        try {
          return JSON.stringify(await getContact(crm, id));
        } catch (err) {
          return `Fout: ${err.message}`;
        }
      },
    }),
    betaZodTool({
      name: "list_records",
      description:
        "Haal recente records op uit een van de CRM-tabellen (tickets, invoices, contracts, deals, tasks, quotes, workflows, lists), optioneel gefilterd op status.",
      inputSchema: z.object({
        table: z.enum(ALLOWED_TABLES),
        status: z.string().optional().describe("Optioneel: filter op status"),
      }),
      run: async ({ table, status }) => {
        try {
          return JSON.stringify(await listRecords(crm, table, status));
        } catch (err) {
          return `Fout: ${err.message}`;
        }
      },
    }),
    betaZodTool({
      name: "search_knowledge_articles",
      description: "Doorzoek de interne kennisbank (how-to's en procedures) op titel, categorie of inhoud.",
      inputSchema: z.object({ query: z.string() }),
      run: async ({ query }) => {
        try {
          return JSON.stringify(await searchKnowledgeArticles(crm, query));
        } catch (err) {
          return `Fout: ${err.message}`;
        }
      },
    }),
  ];

  const client = new Anthropic();
  let finalMessage;
  try {
    finalMessage = await client.beta.messages.toolRunner({
      model: "claude-opus-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools,
      messages: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch (err) {
    return NextResponse.json({ error: `Claude API error: ${err.message}` }, { status: 502 });
  }

  const text = finalMessage.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return NextResponse.json({ reply: text });
}
