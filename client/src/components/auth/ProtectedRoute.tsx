'use client';

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !user) router.replace('/login');
  }, [isInitializing, router, user]);

  if (isInitializing || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-7 w-7 animate-spin text-brand-blue" /></div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
