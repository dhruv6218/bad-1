'use client';

import React from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, DollarSign, Clock } from 'lucide-react';

export const Analytics = () => {
  const { activeWorkspace } = useWorkspace();
  const [stats, setStats] = React.useState({ invoices: 0, recovered: 0, pending: 0, averageDays: 0 });
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    if (!activeWorkspace?.id) return;
    Promise.all([api.invoices.list(activeWorkspace.id), api.activity.list(activeWorkspace.id)])
      .then(([invoices, activity]) => {
        const paid = invoices.filter((invoice: any) => invoice.status === 'paid');
        const pending = invoices.filter((invoice: any) => invoice.status === 'pending');
        const days = paid.map((invoice: any) => Number(invoice.days_to_payment || 0)).filter(Boolean);
        setStats({ invoices: invoices.length, recovered: paid.reduce((sum: number, invoice: any) => sum + Number(invoice.amount || 0), 0), pending: pending.length, averageDays: days.length ? Math.round(days.reduce((sum: number, day: number) => sum + day, 0) / days.length) : 0 });
        void activity;
      }).finally(() => setIsLoading(false));
  }, [activeWorkspace?.id]);
  return (
    <AppLayout title="Analytics" subtitle="Recovery performance & trends">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BarChart3, label: 'Invoices tracked', value: stats.invoices },
            { icon: DollarSign, label: 'Recovered revenue', value: `$${stats.recovered.toLocaleString()}` },
            { icon: TrendingUp, label: 'Pending recovery', value: stats.pending },
            { icon: Clock, label: 'Average days to payment', value: stats.averageDays || '—' },
          ].map((item) => <div key={item.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"><item.icon className="w-5 h-5 text-brand-blue mb-4" /><div className="text-2xl font-black text-gray-900">{isLoading ? '…' : item.value}</div><div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{item.label}</div></div>)}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"><h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Workspace recovery data</h2><p className="text-sm text-gray-500">These metrics are calculated from your live Supabase invoice and activity records. Add invoices and record payments to build a complete trend history.</p></div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
