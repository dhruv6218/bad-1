import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, DollarSign, LogOut, Shield, Users, Building2, FileText, Loader2 } from "lucide-react";
import Link from "@/lib/navigation";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

type Overview = { users: number; workspaces: number; invoices: number; recovered_amount: number; active_chases: number };

export const AdminDashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void supabase.rpc("get_admin_overview").then(({ data, error: loadError }) => { if (loadError) setError(loadError.message); else setOverview(data as Overview); });
  }, []);
  const handleSignOut = async () => { await signOut(); router.push("/godview"); };
  const cards = overview ? [
    { label: "Users", value: overview.users, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Workspaces", value: overview.workspaces, icon: Building2, color: "text-purple-600 bg-purple-50" },
    { label: "Invoices", value: overview.invoices, icon: FileText, color: "text-orange-600 bg-orange-50" },
    { label: "Recovered", value: `$${Number(overview.recovered_amount).toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
  ] : [];
  return <div className="min-h-screen bg-gray-50 font-sans"><aside className="fixed z-50 flex h-full w-64 flex-col border-r border-slate-800 bg-sidebar-dark"><div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6"><Shield className="h-5 w-5 text-astrix-teal" /><span className="font-heading text-lg font-black tracking-tight text-white">God View</span></div><div className="flex-1 px-4 py-6"><div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Access level</div><div className="mt-1 flex items-center gap-2 text-sm font-bold text-white"><CheckCircle2 className="h-4 w-4 text-green-400" /> Allowlisted admin</div></div><Link href="/app" className="mt-6 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-400 hover:bg-sidebar-hover hover:text-white">View customer app</Link></div><div className="border-t border-slate-800 p-4"><div className="mb-3 truncate px-2 text-xs text-slate-500">{user?.email}</div><button onClick={() => void handleSignOut()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-400 hover:text-red-400"><LogOut className="h-4 w-4" /> Sign out</button></div></aside><main className="ml-64 p-8"><div className="mx-auto max-w-6xl"><div className="mb-8"><h1 className="font-heading text-3xl font-black text-gray-900">System overview</h1><p className="mt-1 text-sm text-gray-500">Astrix AI operational metrics from the protected Supabase admin boundary.</p></div>{error && <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle className="h-4 w-4" />{error}</div>}{!overview && !error ? <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-brand-blue" /></div> : <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div><div className="font-heading text-3xl font-black text-gray-900">{value}</div><div className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div></div>)}</div><div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-brand-blue" /><h2 className="font-heading font-bold text-gray-900">Recovery queue</h2></div><div className="font-heading text-4xl font-black text-gray-900">{overview?.active_chases ?? 0}</div><p className="mt-2 text-sm text-gray-500">Pending invoices currently eligible for the recovery worker.</p></div><div className="rounded-2xl border border-green-100 bg-green-50 p-6"><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /><h2 className="font-heading font-bold text-green-900">Security boundary</h2></div><p className="text-sm leading-relaxed text-green-800">Admin metrics are returned only by the database allowlist RPC. Client users cannot read auth.users, rate-limit buckets, webhook events, or admin data directly.</p></div></div></>}</div></main></div>;
};

export default AdminDashboard;
