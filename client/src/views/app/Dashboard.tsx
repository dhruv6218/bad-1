import React, { useEffect, useState } from "react";
import { Activity, AlertCircle, Bot, ChevronRight, CreditCard, DollarSign, FileText, Send, TrendingUp, UploadCloud, Zap } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { AppLayout } from "../../layouts/AppLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Skeleton } from "../../components/ui/skeleton";
import { getDashboardSnapshot } from "../../lib/recovery";
import type { ActivityItem, DashboardMetrics } from "../../types";

const initialMetrics: DashboardMetrics = {
  total_recovered: 0,
  currently_outstanding: 0,
  active_chases: 0,
  recovery_rate: 0,
  pending_invoices: 0,
  this_month_recovered: 0,
};

function formatCurrency(value: number, currency = "USD") {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function timeAgo(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const { activeWorkspace, isWorkspaceInitializing } = useWorkspace();
  const router = useRouter();
  const [metrics, setMetrics] = useState(initialMetrics);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!activeWorkspace) {
      setMetrics(initialMetrics);
      setActivities([]);
      setIsLoading(false);
      return () => { active = false; };
    }
    setIsLoading(true);
    void getDashboardSnapshot(activeWorkspace.id)
      .then((snapshot) => {
        if (!active) return;
        setMetrics(snapshot.metrics);
        setActivities(snapshot.activities);
        setError(null);
      })
      .catch((loadError: Error) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [activeWorkspace]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  if (isLoading || isWorkspaceInitializing) {
    return (
      <AppLayout title={`Welcome back, ${firstName}.`} subtitle="Loading your recovery dashboard...">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}</div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><Skeleton className="h-80 rounded-2xl lg:col-span-2" /><Skeleton className="h-80 rounded-2xl" /></div>
        </div>
      </AppLayout>
    );
  }

  if (!activeWorkspace) {
    return (
      <AppLayout title={`Welcome back, ${firstName}.`} subtitle="Your recovery workspace is ready when you are.">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50"><BuildingIcon /></div>
          <h2 className="font-heading text-xl font-bold text-gray-900">Create your first workspace</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">Complete onboarding to connect a payment gateway and start recovering overdue invoices.</p>
          <button onClick={() => router.push("/onboarding/step-1")} className="mt-6 rounded-xl bg-brand-blue px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">Start onboarding</button>
        </div>
      </AppLayout>
    );
  }

  const cards = [
    { label: "Total Recovered", value: formatCurrency(metrics.total_recovered), note: `+${formatCurrency(metrics.this_month_recovered)} this month`, icon: DollarSign, tone: "green" },
    { label: "Outstanding", value: formatCurrency(metrics.currently_outstanding), note: `${metrics.pending_invoices} invoices awaiting payment`, icon: AlertCircle, tone: "red" },
    { label: "Recovery Rate", value: `${metrics.recovery_rate}%`, note: "Based on recorded invoice outcomes", icon: Zap, tone: "teal" },
    { label: "Active Chases", value: String(metrics.active_chases), note: "AI automation enabled", icon: Activity, tone: "blue" },
  ];

  return (
    <AppLayout title={`Welcome back, ${firstName}.`} subtitle="Here’s your revenue recovery overview.">
      <div className="space-y-6">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Could not load live workspace data: {error}</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, note, icon: Icon, tone }) => (
            <div key={label} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-60 ${tone === "green" ? "bg-green-50" : tone === "red" ? "bg-red-50" : tone === "teal" ? "bg-teal-50" : "bg-blue-50"}`} />
              <div className="relative z-10"><div className="mb-4 flex items-center gap-2"><div className={`rounded-xl p-2 ${tone === "green" ? "bg-green-100 text-green-600" : tone === "red" ? "bg-red-100 text-red-500" : tone === "teal" ? "bg-teal-100 text-astrix-teal" : "bg-blue-100 text-brand-blue"}`}><Icon className="h-4 w-4" /></div><span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{label}</span></div><div className="font-heading text-3xl font-black text-gray-900">{value}</div><div className="mt-2 text-xs font-bold text-gray-500">{note}</div>{label === "Recovery Rate" && <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100"><div className="h-1.5 rounded-full bg-astrix-teal" style={{ width: `${metrics.recovery_rate}%` }} /></div>}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4"><h2 className="flex items-center gap-2 font-heading text-base font-bold text-gray-900"><Activity className="h-4 w-4 text-brand-blue" /> Activity Feed</h2><span className="flex items-center gap-1.5 text-xs font-bold text-green-600"><span className="h-2 w-2 rounded-full bg-green-500" /> Live data</span></div>
            <div className="divide-y divide-gray-50">{activities.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">Activity will appear here as invoices and reminders move through recovery.</div> : activities.map((activity) => <div key={activity.id} className="flex items-start gap-4 px-6 py-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100"><Send className="h-5 w-5 text-blue-600" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium leading-snug text-gray-900">{activity.message}</p><div className="mt-1 flex items-center gap-3"><span className="text-xs text-gray-400">{timeAgo(activity.timestamp)}</span>{activity.amount && <span className="font-mono text-xs font-bold text-gray-600">{formatCurrency(activity.amount)}</span>}</div></div></div>)}</div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white shadow-xl"><div className="relative z-10"><div className="mb-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-400" /><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Daily Chase Engine</span></div><h3 className="mb-1 font-heading text-lg font-bold">Automation is ready</h3><p className="mb-5 text-sm text-gray-400">Connect a gateway and enable reminders to begin.</p><div className="space-y-2 text-xs font-mono text-gray-400"><div className="flex justify-between"><span>Workspace</span><span className="font-bold text-white">{activeWorkspace.name}</span></div><div className="flex justify-between"><span>Guardrail</span><span className="font-bold text-astrix-teal">3–5 day gap</span></div></div></div></div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Quick Actions</h3><div className="space-y-2">{[["Manage Invoices", "View and import invoices", UploadCloud, "/app/invoices"], ["Train AI Tone", "Customize your voice", Bot, "/app/tone"], ["Connect Gateway", "Stripe, Razorpay, UPI", CreditCard, "/app/gateways"]].map(([title, description, Icon, path]) => { const IconComponent = Icon as React.ComponentType<{ className?: string }>; return <button key={title as string} onClick={() => router.push(path as string)} className="group flex w-full items-center gap-3 rounded-xl bg-gray-50 p-3 text-left transition hover:bg-gray-100"><div className="rounded-lg bg-blue-100 p-1.5"><IconComponent className="h-4 w-4 text-brand-blue" /></div><div><div className="text-sm font-bold text-gray-900">{title as string}</div><div className="text-[11px] text-gray-400">{description as string}</div></div><ChevronRight className="ml-auto h-4 w-4 text-gray-300" /></button>; })}</div></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function BuildingIcon() { return <FileText className="h-7 w-7 text-brand-blue" />; }

export default Dashboard;
