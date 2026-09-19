import type { DashboardMetrics, Invoice } from "../types";

export function daysOverdue(dueDate: string, now = Date.now()) {
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((now - due) / 86_400_000));
}

export function calculateRecoveryMetrics(invoices: Invoice[]): DashboardMetrics {
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const pending = invoices.filter((invoice) => invoice.status === "pending");
  const totalRecovered = paid.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const outstanding = pending.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const recoveryBase = totalRecovered + outstanding;
  return {
    total_recovered: totalRecovered,
    currently_outstanding: outstanding,
    active_chases: pending.filter((invoice) => invoice.ai_status !== "paid").length,
    recovery_rate: recoveryBase > 0 ? Math.round((totalRecovered / recoveryBase) * 100) : 0,
    pending_invoices: pending.length,
    this_month_recovered: totalRecovered,
  };
}

export function buildReminderIdempotencyKey(invoiceId: string, day: string) {
  return `${invoiceId}:${day}`;
}
