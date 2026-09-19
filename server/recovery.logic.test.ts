import { describe, expect, it } from "vitest";
import type { Invoice } from "../client/src/types";
import { buildReminderIdempotencyKey, calculateRecoveryMetrics, daysOverdue } from "../client/src/lib/recoveryLogic";

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: "invoice-1",
  workspace_id: "workspace-1",
  client_name: "Acme",
  client_email: "billing@acme.test",
  amount: 100,
  currency: "USD",
  due_date: "2026-09-17",
  status: "pending",
  ai_status: "pending",
  last_chased_at: null,
  reminder_count: 0,
  days_overdue: 2,
  created_at: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

describe("recovery business rules", () => {
  it("calculates whole overdue days without using the client timezone", () => {
    expect(daysOverdue("2026-09-17", new Date("2026-09-19T12:00:00.000Z").getTime())).toBe(2);
    expect(daysOverdue("2026-09-19", new Date("2026-09-19T12:00:00.000Z").getTime())).toBe(0);
  });

  it("calculates recovery totals and excludes paused invoices from active chases", () => {
    const metrics = calculateRecoveryMetrics([
      invoice({ id: "paid", amount: 250, status: "paid", ai_status: "paid" }),
      invoice({ id: "pending", amount: 100, status: "pending", ai_status: "nudge_sent" }),
      invoice({ id: "paused", amount: 900, status: "paused", ai_status: "pending" }),
    ]);
    expect(metrics).toEqual({
      total_recovered: 250,
      currently_outstanding: 100,
      active_chases: 1,
      recovery_rate: 71,
      pending_invoices: 1,
      this_month_recovered: 250,
    });
  });

  it("builds a stable daily reminder idempotency key", () => {
    expect(buildReminderIdempotencyKey("invoice-1", "2026-09-19")).toBe("invoice-1:2026-09-19");
    expect(buildReminderIdempotencyKey("invoice-1", "2026-09-19")).toBe(buildReminderIdempotencyKey("invoice-1", "2026-09-19"));
  });
});
