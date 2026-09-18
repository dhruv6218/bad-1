'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/app')}`);
    }
  }, [isInitializing, pathname, router, user]);

  if (isInitializing || !user) {
    return <main className="min-h-screen grid place-items-center bg-slate-950" aria-live="polite"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /><span className="sr-only">Checking your session</span></main>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
