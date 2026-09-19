import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, CirclePause, Eye, FileText, Loader2, Pause, Play, Plus, RefreshCw, Send, X } from "lucide-react";
import { AppLayout } from "../../layouts/AppLayout";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { createInvoice, listInvoices, setInvoicePaused } from "../../lib/recovery";
import type { Invoice } from "../../types";

const emptyForm = { client_name: "", client_email: "", amount: "", currency: "USD", due_date: "" };

function currency(value: number, code: string) { return new Intl.NumberFormat("en-US", { style: "currency", currency: code || "USD", maximumFractionDigits: 0 }).format(value); }
function statusLabel(invoice: Invoice) { if (invoice.status === "paid") return "Paid"; if (invoice.status === "paused") return "AI Paused"; if (invoice.ai_status === "escalated") return "Escalated"; if (invoice.ai_status === "nudge_sent") return "Nudge Sent"; return "Queued"; }
function statusClass(invoice: Invoice) { if (invoice.status === "paid") return "bg-green-100 text-green-700"; if (invoice.status === "paused") return "bg-gray-100 text-gray-600"; if (invoice.ai_status === "escalated") return "bg-purple-100 text-purple-700"; if (invoice.ai_status === "nudge_sent") return "bg-blue-100 text-blue-700"; return "bg-yellow-100 text-yellow-700"; }

export const Invoices = () => {
  const { activeWorkspace, isWorkspaceInitializing } = useWorkspace();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<"all" | "pending" | "paused" | "paid">("all");
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    if (!activeWorkspace) { setInvoices([]); setIsLoading(false); return; }
    setIsLoading(true);
    try { setInvoices(await listInvoices(activeWorkspace.id)); setError(null); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load invoices"); } finally { setIsLoading(false); }
  };
  useEffect(() => { void loadInvoices(); }, [activeWorkspace?.id]);

  const filteredInvoices = useMemo(() => filter === "all" ? invoices : invoices.filter((invoice) => invoice.status === filter), [filter, invoices]);
  const totals = { all: invoices.length, pending: invoices.filter((invoice) => invoice.status === "pending").length, paused: invoices.filter((invoice) => invoice.status === "paused").length, paid: invoices.filter((invoice) => invoice.status === "paid").length };

  const togglePause = async (invoice: Invoice) => {
    try {
      const updated = await setInvoicePaused(invoice.id, invoice.status !== "paused");
      setInvoices((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : "Could not update invoice"); }
  };

  const submitInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeWorkspace) return;
    setIsSaving(true);
    try {
      const invoice = await createInvoice({ ...form, workspace_id: activeWorkspace.id, amount: Number(form.amount) });
      setInvoices((current) => [invoice, ...current]);
      setForm(emptyForm);
      setFormOpen(false);
      setError(null);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not create invoice"); } finally { setIsSaving(false); }
  };

  if (isWorkspaceInitializing || isLoading) return <AppLayout title="Action Center" subtitle="Loading live invoice data..."><div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div></AppLayout>;
  if (!activeWorkspace) return <AppLayout title="Action Center" subtitle="Connect a workspace before managing invoices."><div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">Your workspace has no invoices yet. Complete onboarding first.</div></AppLayout>;

  return (
    <AppLayout title="Action Center" subtitle="Manage your invoices and AI schedules" actions={<button onClick={() => setFormOpen((open) => !open)} className="flex items-center gap-2 rounded-xl bg-astrix-teal px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-astrix-darkTeal"><Plus className="h-4 w-4" /> Add Invoice</button>}>
      <div className="space-y-6">
        {error && <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}
        {formOpen && <form onSubmit={submitInvoice} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-heading font-bold text-gray-900">Add invoice</h2><button type="button" onClick={() => setFormOpen(false)}><X className="h-4 w-4 text-gray-500" /></button></div><div className="grid grid-cols-1 gap-3 md:grid-cols-5"><input required value={form.client_name} onChange={(event) => setForm({ ...form, client_name: event.target.value })} placeholder="Client name" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue" /><input required type="email" value={form.client_email} onChange={(event) => setForm({ ...form, client_email: event.target.value })} placeholder="Client email" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue" /><input required type="number" min="1" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue" /><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"><option value="USD">USD</option><option value="EUR">EUR</option><option value="INR">INR</option><option value="GBP">GBP</option></select><input required type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue" /></div><button disabled={isSaving} type="submit" className="mt-4 flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save invoice</button></form>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{(["all", "pending", "paused", "paid"] as const).map((key) => <button key={key} onClick={() => setFilter(key)} className={`rounded-2xl border p-5 text-left transition ${filter === key ? "border-astrix-teal bg-white shadow-sm ring-1 ring-astrix-teal" : "border-gray-200 bg-white hover:border-gray-300"}`}><div className="font-heading text-2xl font-black text-gray-900">{totals[key]}</div><div className="text-sm font-bold capitalize text-gray-500">{key}</div></button>)}</div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-6 py-5"><h2 className="font-heading text-base font-bold text-gray-900">{filter === "all" ? "All invoices" : `${filter[0].toUpperCase()}${filter.slice(1)} invoices`}</h2><button onClick={() => void loadInvoices()} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>{filteredInvoices.length === 0 ? <div className="p-14 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" /><p className="text-sm font-medium text-gray-500">No invoices match this view.</p><p className="mt-1 text-xs text-gray-400">Add an invoice to activate the recovery engine.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400"><tr><th className="px-6 py-4">Client</th><th className="px-4 py-4">Amount</th><th className="px-4 py-4">Due date</th><th className="px-4 py-4">Overdue</th><th className="px-4 py-4">AI status</th><th className="px-4 py-4">Reminders</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{filteredInvoices.map((invoice) => <tr key={invoice.id} className="text-sm"><td className="px-6 py-5"><div className="font-bold text-gray-900">{invoice.client_name}</div><div className="mt-0.5 text-xs text-gray-400">{invoice.client_email}</div></td><td className="px-4 py-5 font-heading font-bold text-gray-900">{currency(Number(invoice.amount), invoice.currency)}</td><td className="px-4 py-5 text-gray-600"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-gray-400" />{new Date(invoice.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></td><td className={`px-4 py-5 font-bold ${invoice.days_overdue > 14 ? "text-red-600" : invoice.days_overdue > 0 ? "text-orange-500" : "text-green-600"}`}>{invoice.status === "paid" ? "—" : invoice.days_overdue > 0 ? `${invoice.days_overdue} days` : "Not due"}</td><td className="px-4 py-5"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(invoice)}`}>{invoice.status === "paid" ? <CheckCircle2 className="h-3 w-3" /> : invoice.status === "paused" ? <CirclePause className="h-3 w-3" /> : <Send className="h-3 w-3" />}{statusLabel(invoice)}</span></td><td className="px-4 py-5 font-mono text-gray-600">{invoice.reminder_count}</td><td className="px-6 py-5"><div className="flex items-center justify-end gap-2">{invoice.status !== "paid" && <button title={invoice.status === "paused" ? "Resume AI" : "Pause AI"} onClick={() => void togglePause(invoice)} className={`rounded-lg px-3 py-2 text-xs font-bold ${invoice.status === "paused" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>{invoice.status === "paused" ? <span className="flex items-center gap-1"><Play className="h-3 w-3" /> Resume</span> : <span className="flex items-center gap-1"><Pause className="h-3 w-3" /> Pause AI</span>}</button>}<button title="View invoice" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Eye className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}</div>
      </div>
    </AppLayout>
  );
};

export default Invoices;
