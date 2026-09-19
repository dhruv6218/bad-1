import { supabase } from "./supabase";
import type { ActivityItem, DashboardMetrics, Invoice } from "../types";
import { calculateRecoveryMetrics, daysOverdue } from "./recoveryLogic";

async function recordAuditEvent(workspaceId: string, eventType: string, entityId: string, details: Record<string, unknown>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    actor_id: userData.user.id,
    event_type: eventType,
    entity_type: "invoice",
    entity_id: entityId,
    details,
  });
  if (error) console.warn("Audit event was not recorded", error.message);
}

export async function listInvoices(workspaceId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, workspace_id, client_name, client_email, amount, currency, due_date, status, ai_status, last_chased_at, reminder_count, created_at")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Omit<Invoice, "days_overdue">[]).map((invoice) => ({
    ...invoice,
    days_overdue: invoice.status === "paid" ? 0 : daysOverdue(invoice.due_date),
  })) as Invoice[];
}

export async function listActivity(workspaceId: string) {
  const { data, error } = await supabase
    .from("activity_items")
    .select("id, type, message, amount, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string; type: ActivityItem["type"]; message: string; amount?: number; created_at: string }>).map((item) => ({
    id: item.id,
    type: item.type,
    message: item.message,
    amount: item.amount,
    timestamp: item.created_at,
  })) as ActivityItem[];
}

export async function getDashboardSnapshot(workspaceId: string): Promise<{ metrics: DashboardMetrics; activities: ActivityItem[] }> {
  const [invoices, activities] = await Promise.all([listInvoices(workspaceId), listActivity(workspaceId)]);
  return {
    metrics: calculateRecoveryMetrics(invoices),
    activities,
  };
}

export async function setInvoicePaused(invoiceId: string, paused: boolean) {
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: paused ? "paused" : "pending" })
    .eq("id", invoiceId)
    .select("id, workspace_id, client_name, client_email, amount, currency, due_date, status, ai_status, last_chased_at, reminder_count, created_at")
    .single();
  if (error) throw error;
  void recordAuditEvent(data.workspace_id, paused ? "invoice.paused" : "invoice.resumed", data.id, { status: paused ? "paused" : "pending" });
  return {
    ...(data as Omit<Invoice, "days_overdue">),
    days_overdue: paused || data.status === "paid" ? 0 : daysOverdue(data.due_date),
  } as Invoice;
}

export async function createInvoice(input: {
  workspace_id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  due_date: string;
}) {
  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...input, amount: Number(input.amount), status: "pending", ai_status: "pending", reminder_count: 0 })
    .select("id, workspace_id, client_name, client_email, amount, currency, due_date, status, ai_status, last_chased_at, reminder_count, created_at")
    .single();
  if (error) throw error;
  void recordAuditEvent(data.workspace_id, "invoice.created", data.id, { amount: Number(data.amount), currency: data.currency });
  return { ...(data as Omit<Invoice, "days_overdue">), days_overdue: daysOverdue(data.due_date) } as Invoice;
}
