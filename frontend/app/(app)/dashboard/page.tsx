'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  IndianRupee,
  Package,
  Clock,
  Wallet,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import type { ShopDashboard } from '@/lib/types';
import { inr } from '@/lib/format';
import { Card } from '@/components/ui';
import StaffDashboard from './staff-dashboard';
import PlatformDashboard from './platform-dashboard';

function Stat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tint}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const isPlatform = user?.role === 'PLATFORM_ADMIN';
  const isStaff = user?.role === 'LAUNDRY_STAFF';
  if (isStaff) return <StaffDashboard />;

  const { data, isLoading } = useQuery<ShopDashboard>({
    queryKey: ['dashboard', 'shop'],
    queryFn: async () => (await api.get('/analytics/shop')).data,
    enabled: !isPlatform,
  });

  if (isPlatform) return <PlatformDashboard />;

  if (isLoading || !data) {
    return <p className="text-slate-400">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          icon={IndianRupee}
          label="Collected today"
          value={inr(data.revenue.collectedToday)}
          tint="bg-emerald-100 text-emerald-600"
        />
        <Stat
          icon={Wallet}
          label="Outstanding balance"
          value={inr(data.revenue.outstanding)}
          tint="bg-amber-100 text-amber-600"
        />
        <Stat
          icon={IndianRupee}
          label="Collected (30 days)"
          value={inr(data.revenue.collectedLast30Days)}
          tint="bg-sky-100 text-sky-600"
        />
        <Stat
          icon={Package}
          label="Orders today"
          value={data.orders.today}
          tint="bg-indigo-100 text-indigo-600"
        />
        <Stat
          icon={Clock}
          label="Pending orders"
          value={data.orders.pending}
          tint="bg-rose-100 text-rose-600"
        />
        <Stat
          icon={CheckCircle2}
          label="Delivered"
          value={data.orders.delivered}
          tint="bg-emerald-100 text-emerald-600"
        />
        <Stat
          icon={UserPlus}
          label="New customers (30d)"
          value={data.customers.newLast30Days}
          tint="bg-violet-100 text-violet-600"
        />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-slate-700">
          Top services by revenue
        </h2>
        {data.topServices.length === 0 ? (
          <p className="text-sm text-slate-400">No orders yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topServices}>
              <XAxis dataKey="itemName" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
