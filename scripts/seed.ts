/**
 * Studioflow — demo seed script (Phase 2).
 *
 * Creates a demo Owner account via the Supabase Admin API (which fires the
 * `handle_new_user` trigger to create the profile + Free subscription), then
 * populates realistic CRM data using the service role (bypasses RLS).
 *
 * Run with:  npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_OWNER = {
  email: "demo@studioflow.app",
  password: "Demo123!Studioflow",
  fullName: "Demo Owner",
};

const TEAM = [
  { email: "manager@studioflow.app", fullName: "Mara Manager", role: "Manager" as const },
  { email: "alex@studioflow.app", fullName: "Alex Member", role: "Member" as const },
  { email: "sam@studioflow.app", fullName: "Sam Member", role: "Member" as const },
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function getOrCreateOwner(admin: SupabaseClient<Database>): Promise<string> {
  // Look for an existing demo owner first (makes the script idempotent).
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  const existing = list.users.find((u) => u.email === DEMO_OWNER.email);
  if (existing) {
    console.log(`• Reusing existing demo owner ${DEMO_OWNER.email} (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_OWNER.email,
    password: DEMO_OWNER.password,
    email_confirm: true,
    user_metadata: { full_name: DEMO_OWNER.fullName },
  });
  if (error) throw error;
  console.log(`• Created demo owner ${DEMO_OWNER.email} (${data.user.id})`);
  return data.user.id;
}

async function clearWorkspace(admin: SupabaseClient<Database>, ownerId: string) {
  // Cascades handle children (projects, tasks, invoices, notes, files).
  await admin.from("activity_logs").delete().eq("workspace_id", ownerId);
  await admin.from("clients").delete().eq("user_id", ownerId);
  await admin.from("team_members").delete().eq("owner_id", ownerId);
}

async function seed() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ownerId = await getOrCreateOwner(admin);
  await clearWorkspace(admin, ownerId);

  // Team members (invitation rows; not real auth accounts in the demo) --------
  const { error: teamError } = await admin.from("team_members").insert(
    TEAM.map((t) => ({ owner_id: ownerId, email: t.email, role: t.role })),
  );
  if (teamError) throw teamError;

  // Clients -------------------------------------------------------------------
  const clientSeed = [
    { name: "Northwind Studios", company: "Northwind LLC", email: "hello@northwind.io", phone: "+1 202 555 0111", status: "Active" as const, notes: "Retainer client, monthly design work." },
    { name: "Brightpath Labs", company: "Brightpath Inc.", email: "team@brightpath.dev", phone: "+1 202 555 0122", status: "Active" as const, notes: "Product redesign engagement." },
    { name: "Quill & Co.", company: "Quill", email: "contact@quill.co", phone: "+1 202 555 0133", status: "Lead" as const, notes: "Inbound lead from referral." },
    { name: "Harbor Freight Media", company: "Harbor Media", email: "ops@harbormedia.tv", phone: "+1 202 555 0144", status: "Inactive" as const, notes: "Paused engagement Q1." },
    { name: "Vertex Analytics", company: "Vertex", email: "founders@vertex.ai", phone: "+1 202 555 0155", status: "Lead" as const, notes: "Evaluating proposal." },
  ];
  const { data: clients, error: clientsError } = await admin
    .from("clients")
    .insert(clientSeed.map((c) => ({ ...c, user_id: ownerId })))
    .select();
  if (clientsError) throw clientsError;
  const clientByName = Object.fromEntries(clients.map((c) => [c.name, c.id]));

  // Projects ------------------------------------------------------------------
  const projectSeed = [
    { client: "Northwind Studios", name: "Website Revamp", description: "Marketing site redesign + CMS.", budget: 18000, deadline: daysFromNow(30), status: "In Progress" as const },
    { client: "Northwind Studios", name: "Brand Guidelines", description: "Logo system and brand book.", budget: 6500, deadline: daysFromNow(12), status: "Review" as const },
    { client: "Brightpath Labs", name: "Mobile App MVP", description: "iOS/Android MVP build.", budget: 42000, deadline: daysFromNow(60), status: "Planning" as const },
    { client: "Brightpath Labs", name: "Design System", description: "Component library + tokens.", budget: 15000, deadline: daysFromNow(45), status: "In Progress" as const },
    { client: "Quill & Co.", name: "Landing Page", description: "Single-page launch site.", budget: 4200, deadline: daysFromNow(20), status: "Planning" as const },
    { client: "Harbor Freight Media", name: "Q1 Campaign", description: "Seasonal ad campaign assets.", budget: 9800, deadline: daysFromNow(-5), status: "Completed" as const },
  ];
  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .insert(
      projectSeed.map((p) => ({
        user_id: ownerId,
        client_id: clientByName[p.client],
        name: p.name,
        description: p.description,
        budget: p.budget,
        deadline: p.deadline,
        status: p.status,
      })),
    )
    .select();
  if (projectsError) throw projectsError;
  const projectByName = Object.fromEntries(projects.map((p) => [p.name, p.id]));

  // Tasks ---------------------------------------------------------------------
  const taskSeed = [
    { project: "Website Revamp", title: "Wireframe homepage", priority: "High" as const, status: "Done" as const, due: daysFromNow(-2) },
    { project: "Website Revamp", title: "Design hero section", priority: "High" as const, status: "Doing" as const, due: daysFromNow(3) },
    { project: "Website Revamp", title: "CMS integration", priority: "Medium" as const, status: "Todo" as const, due: daysFromNow(10) },
    { project: "Brand Guidelines", title: "Finalize logo variants", priority: "High" as const, status: "Doing" as const, due: daysFromNow(2) },
    { project: "Brand Guidelines", title: "Color & type system", priority: "Medium" as const, status: "Done" as const, due: daysFromNow(-1) },
    { project: "Mobile App MVP", title: "Define MVP scope", priority: "High" as const, status: "Doing" as const, due: daysFromNow(5) },
    { project: "Mobile App MVP", title: "Auth flow spec", priority: "Medium" as const, status: "Todo" as const, due: daysFromNow(14) },
    { project: "Design System", title: "Token architecture", priority: "Medium" as const, status: "Doing" as const, due: daysFromNow(7) },
    { project: "Design System", title: "Button + input components", priority: "Low" as const, status: "Todo" as const, due: daysFromNow(15) },
    { project: "Landing Page", title: "Copywriting", priority: "Low" as const, status: "Todo" as const, due: daysFromNow(9) },
    { project: "Q1 Campaign", title: "Export final assets", priority: "Medium" as const, status: "Done" as const, due: daysFromNow(-6) },
    { project: "Q1 Campaign", title: "Client handoff", priority: "Low" as const, status: "Done" as const, due: daysFromNow(-4) },
  ];
  const { error: tasksError } = await admin.from("tasks").insert(
    taskSeed.map((t) => ({
      project_id: projectByName[t.project],
      assigned_user: ownerId,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due,
    })),
  );
  if (tasksError) throw tasksError;

  // Invoices ------------------------------------------------------------------
  const invoiceSeed = [
    { client: "Northwind Studios", project: "Website Revamp", number: "INV-1001", amount: 9000, due: daysFromNow(-10), status: "Paid" as const },
    { client: "Northwind Studios", project: "Brand Guidelines", number: "INV-1002", amount: 6500, due: daysFromNow(7), status: "Pending" as const },
    { client: "Brightpath Labs", project: "Design System", number: "INV-1003", amount: 7500, due: daysFromNow(-3), status: "Paid" as const },
    { client: "Brightpath Labs", project: "Mobile App MVP", number: "INV-1004", amount: 21000, due: daysFromNow(20), status: "Pending" as const },
    { client: "Quill & Co.", project: "Landing Page", number: "INV-1005", amount: 2100, due: daysFromNow(-8), status: "Overdue" as const },
    { client: "Harbor Freight Media", project: "Q1 Campaign", number: "INV-1006", amount: 9800, due: daysFromNow(-15), status: "Paid" as const },
    { client: "Northwind Studios", project: null, number: "INV-1007", amount: 3200, due: daysFromNow(-20), status: "Overdue" as const },
    { client: "Brightpath Labs", project: null, number: "INV-1008", amount: 5400, due: daysFromNow(25), status: "Pending" as const },
  ];
  const { error: invoicesError } = await admin.from("invoices").insert(
    invoiceSeed.map((i) => ({
      user_id: ownerId,
      client_id: clientByName[i.client],
      project_id: i.project ? projectByName[i.project] : null,
      invoice_number: i.number,
      amount: i.amount,
      due_date: i.due,
      status: i.status,
    })),
  );
  if (invoicesError) throw invoicesError;

  // Notes ---------------------------------------------------------------------
  const noteSeed = [
    { client: "Northwind Studios", content: "Prefers async updates via email." },
    { client: "Northwind Studios", content: "Renewal discussion scheduled next month." },
    { client: "Brightpath Labs", content: "Stakeholders: CEO + Head of Product." },
    { client: "Quill & Co.", content: "Budget sensitive — keep scope tight." },
    { client: "Vertex Analytics", content: "Waiting on signed proposal." },
    { client: "Harbor Freight Media", content: "Re-engage in Q2." },
  ];
  const { error: notesError } = await admin.from("notes").insert(
    noteSeed.map((n) => ({
      client_id: clientByName[n.client],
      user_id: ownerId,
      content: n.content,
    })),
  );
  if (notesError) throw notesError;

  // Client files (metadata only — placeholder URLs) ---------------------------
  const fileSeed = [
    { client: "Northwind Studios", file_name: "contract.pdf", mime: "application/pdf", size: 184320 },
    { client: "Brightpath Labs", file_name: "brief.pdf", mime: "application/pdf", size: 96000 },
    { client: "Brightpath Labs", file_name: "wireframes.png", mime: "image/png", size: 512000 },
    { client: "Quill & Co.", file_name: "proposal.pdf", mime: "application/pdf", size: 72000 },
  ];
  const { error: filesError } = await admin.from("client_files").insert(
    fileSeed.map((f) => ({
      client_id: clientByName[f.client],
      user_id: ownerId,
      file_name: f.file_name,
      file_url: `${ownerId}/${clientByName[f.client]}/${f.file_name}`,
      file_size: f.size,
      mime_type: f.mime,
    })),
  );
  if (filesError) throw filesError;

  // Activity logs -------------------------------------------------------------
  const activitySeed = [
    { action: "Client Created", entity: "client", target: clientByName["Northwind Studios"], ago: 30 },
    { action: "Project Created", entity: "project", target: projectByName["Website Revamp"], ago: 28 },
    { action: "Task Completed", entity: "task", target: projectByName["Website Revamp"], ago: 2 },
    { action: "Invoice Created", entity: "invoice", target: clientByName["Northwind Studios"], ago: 12 },
    { action: "Invoice Paid", entity: "invoice", target: clientByName["Northwind Studios"], ago: 10 },
    { action: "Client Created", entity: "client", target: clientByName["Brightpath Labs"], ago: 25 },
    { action: "Project Created", entity: "project", target: projectByName["Design System"], ago: 18 },
    { action: "Project Completed", entity: "project", target: projectByName["Q1 Campaign"], ago: 5 },
  ];
  const { error: activityError } = await admin.from("activity_logs").insert(
    activitySeed.map((a) => ({
      user_id: ownerId,
      workspace_id: ownerId,
      action: a.action,
      entity_type: a.entity,
      entity_id: a.target,
      created_at: isoDaysAgo(a.ago),
    })),
  );
  if (activityError) throw activityError;

  console.log("\n✓ Seed complete.");
  console.log(`  Owner login → ${DEMO_OWNER.email} / ${DEMO_OWNER.password}`);
  console.log(`  Clients: ${clients.length}, Projects: ${projects.length}, Tasks: ${taskSeed.length}, Invoices: ${invoiceSeed.length}`);
}

seed().catch((err) => {
  console.error("\n✗ Seed failed:", err);
  process.exit(1);
});
