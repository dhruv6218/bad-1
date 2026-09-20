import React, { useEffect, useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { supabase } from "../../lib/supabase";
import { CheckCircle2, CreditCard, ExternalLink, Link as LinkIcon, Loader2, Plus, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import type { GatewaySettings } from "../../types";

export const Gateways = () => {
  const { activeWorkspace, isWorkspaceInitializing } = useWorkspace();
  const router = useRouter();
  const [gateways, setGateways] = useState<GatewaySettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!activeWorkspace) { setGateways([]); setIsLoading(false); return () => { active = false; }; }
    setIsLoading(true);
    void supabase.from("gateway_settings").select("id, workspace_id, type, label, static_url, is_active, created_at").eq("workspace_id", activeWorkspace.id).order("created_at", { ascending: true }).then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(loadError.message); else setGateways((data ?? []) as GatewaySettings[]);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [activeWorkspace?.id]);

  if (isWorkspaceInitializing || isLoading) return <AppLayout title="Payment Gateways" subtitle="Loading secure workspace connections..."><div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-brand-blue" /></div></AppLayout>;

  const options = [
    { type: "stripe", label: "Stripe", description: "Use a Stripe Payment Link or hosted checkout URL", icon: CreditCard, color: "bg-[#635BFF]" },
    { type: "razorpay", label: "Razorpay", description: "Use a Razorpay Payment Link for UPI and cards", icon: Zap, color: "bg-[#02042B]" },
    { type: "dodo", label: "Dodo", description: "Use a Dodo hosted payment link", icon: Zap, color: "bg-[#111827]" },
    { type: "upi", label: "Static payment link", description: "UPI deeplink or any hosted checkout URL", icon: LinkIcon, color: "bg-brand-blue" },
  ];

  return <AppLayout title="Payment Gateways" subtitle="Connect integrations to enable 1-click checkouts"><div className="space-y-8">
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load gateway settings: {error}</div>}
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white shadow-xl"><div className="relative z-10 max-w-2xl"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-400" /><span className="text-xs font-bold uppercase tracking-widest text-gray-400">Workspace connections</span></div><h2 className="mb-3 font-heading text-2xl font-black">Seamless 1-click checkouts</h2><p className="mb-6 text-sm leading-relaxed text-gray-400">Connect where clients pay you. Gateway credentials are never displayed back in this dashboard; use test keys until production secret storage is enabled.</p><div className="flex flex-wrap gap-3 text-xs font-bold"><span className="rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1.5">RLS protected</span><span className="rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1.5">Workspace scoped</span></div></div></div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">{options.map((option) => { const connected = gateways.some((gateway) => gateway.type === option.type && gateway.is_active); const Icon = option.icon; return <div key={option.type} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"><div className="mb-6 flex items-center gap-4"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${option.color}`}><Icon className="h-6 w-6" /></div><div><h3 className="font-heading text-lg font-bold text-gray-900">{option.label}</h3><span className={`flex items-center gap-1 text-xs font-bold ${connected ? "text-green-600" : "text-gray-400"}`}>{connected ? <><CheckCircle2 className="h-3 w-3" /> Active</> : "Not connected"}</span></div></div><p className="mb-6 flex-1 text-sm leading-relaxed text-gray-500">{option.description}</p><button onClick={() => router.push("/onboarding/step-1")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:border-brand-blue hover:text-brand-blue">{connected ? "Manage connection" : <><Plus className="h-4 w-4" /> Add payment link</>}</button></div>; })}</div>
    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><ExternalLink className="mt-0.5 h-4 w-4 shrink-0" /><p>Hosted payment links work immediately. Secret provider API keys are never stored in the browser; direct API checkout requires a server-side provider vault and verified webhook configuration.</p></div>
  </div></AppLayout>;
};

export default Gateways;
