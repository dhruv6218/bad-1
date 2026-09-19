import React, { useEffect, useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { getDashboardSnapshot } from "../../lib/recovery";
import { Activity, BarChart3, CheckCircle2, Clock3, DollarSign, Loader2, TrendingUp } from "lucide-react";
import type { DashboardMetrics } from "../../types";

const empty: DashboardMetrics = { total_recovered: 0, currently_outstanding: 0, active_chases: 0, recovery_rate: 0, pending_invoices: 0, this_month_recovered: 0 };

export const Analytics = () => {
  const { activeWorkspace, isWorkspaceInitializing } = useWorkspace();
  const [metrics, setMetrics] = useState(empty);
  const [activityCount, setActivityCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!activeWorkspace) { setMetrics(empty); setIsLoading(false); return; }
    setIsLoading(true);
    void getDashboardSnapshot(activeWorkspace.id).then((snapshot) => { setMetrics(snapshot.metrics); setActivityCount(snapshot.activities.length); }).finally(() => setIsLoading(false));
  }, [activeWorkspace?.id]);
  if (isWorkspaceInitializing || isLoading) return <AppLayout title="Analytics" subtitle="Recovery performance & trends"><div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-brand-blue" /></div></AppLayout>;
  const cards = [{ label: "Recovered", value: `$${metrics.total_recovered.toLocaleString()}`, detail: "All paid invoices", icon: DollarSign, color: "text-green-600 bg-green-50" }, { label: "Recovery rate", value: `${metrics.recovery_rate}%`, detail: "Paid vs outstanding", icon: TrendingUp, color: "text-blue-600 bg-blue-50" }, { label: "Active chases", value: String(metrics.active_chases), detail: "Invoices in automation", icon: Activity, color: "text-purple-600 bg-purple-50" }, { label: "Activity events", value: String(activityCount), detail: "Recent workspace events", icon: Clock3, color: "text-orange-600 bg-orange-50" }];
  return <AppLayout title="Analytics" subtitle="Recovery performance & trends"><div className="space-y-6"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div><div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</div><div className="mt-1 font-heading text-3xl font-black text-gray-900">{value}</div><div className="mt-1 text-xs text-gray-500">{detail}</div></div>)}</div><div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="mb-6 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-brand-blue" /><h2 className="font-heading font-bold text-gray-900">Recovery health</h2></div><div className="mb-3 flex items-end justify-between"><span className="text-sm font-medium text-gray-500">Paid value vs outstanding</span><span className="font-heading text-2xl font-black text-astrix-teal">{metrics.recovery_rate}%</span></div><div className="h-4 overflow-hidden rounded-full bg-red-100"><div className="h-full rounded-full bg-astrix-teal transition-all" style={{ width: `${metrics.recovery_rate}%` }} /></div><div className="mt-4 flex justify-between text-xs font-bold"><span className="flex items-center gap-1 text-astrix-teal"><CheckCircle2 className="h-3 w-3" /> Recovered ${metrics.total_recovered.toLocaleString()}</span><span className="text-red-500">Outstanding ${metrics.currently_outstanding.toLocaleString()}</span></div></div><div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="mb-6 font-heading font-bold text-gray-900">What to do next</h2><div className="space-y-3 text-sm"><div className="rounded-xl bg-gray-50 p-4"><div className="font-bold text-gray-900">Keep the engine fed</div><div className="mt-1 text-xs text-gray-500">Add invoices with due dates and payment links so recovery metrics can improve.</div></div><div className="rounded-xl bg-blue-50 p-4"><div className="font-bold text-blue-900">Connect your payment gateway</div><div className="mt-1 text-xs text-blue-700">A connected gateway enables 1-click payment links in reminders.</div></div></div></div></div></div></AppLayout>;
};

export default Analytics;
