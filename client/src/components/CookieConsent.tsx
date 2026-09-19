import React, { useEffect, useState } from "react";
import { Cookie, Settings2, X } from "lucide-react";

const CONSENT_KEY = "astrix_cookie_consent_v1";

type ConsentChoice = "essential" | "all";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  const save = (choice: ConsentChoice) => {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, updatedAt: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl md:inset-x-auto md:flex md:items-start md:gap-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue"><Cookie className="h-5 w-5" /></div>
      <div className="mt-3 min-w-0 flex-1 md:mt-0"><div className="flex items-start justify-between gap-4"><h2 className="font-heading text-sm font-bold text-gray-900">Your privacy matters</h2><button onClick={() => save("essential")} aria-label="Close cookie preferences" className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button></div><p className="mt-1 text-xs leading-relaxed text-gray-500">We use essential cookies to keep Astrix secure and remember your preferences. Optional analytics cookies help us improve the product and are off unless you allow them.</p>{detailsOpen && <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-600"><div><strong>Essential:</strong> authentication, security, consent preferences.</div><div className="mt-1"><strong>Optional:</strong> product analytics and performance measurement.</div></div>}<div className="mt-4 flex flex-wrap items-center gap-2"><button onClick={() => save("essential")} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Essential only</button><button onClick={() => save("all")} className="rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">Accept all</button><button onClick={() => setDetailsOpen((open) => !open)} className="flex items-center gap-1 px-2 py-2 text-xs font-bold text-gray-500 hover:text-gray-900"><Settings2 className="h-3.5 w-3.5" /> Preferences</button></div></div>
    </div>
  );
}
