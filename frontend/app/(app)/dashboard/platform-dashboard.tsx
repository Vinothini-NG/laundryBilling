'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Package, Users, IndianRupee,
  TrendingUp, CheckCircle2, Clock, XCircle,
  BarChart3, Settings, UserCog, Shirt,
} from 'lucide-react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { Card } from '@/components/ui';

interface PlatformData {
  shops: { total: number; active: number; trial: number; inactive: number };
  totals: { orders: number; customers: number; collected: number };
  leaderboard: { shopId: string; shopName: string; revenue: number }[];
}

const TINTS: Record<string, string> = {
  blue:    'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber:   'bg-amber-100 text-amber-600',
  rose:    'bg-rose-100 text-rose-600',
  indigo:  'bg-indigo-100 text-indigo-600',
  violet:  'bg-violet-100 text-violet-600',
  green:   'bg-green-100 text-green-600',
  sky:     'bg-sky-100 text-sky-600',
};

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: typeof Building2; label: string; value: string | number; color: string; href?: string;
}) {
  const inner = (
    <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${TINTS[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

const QUICK: { href: string; label: string; icon: typeof Package; bg: string }[] = [
  { href: '/orders',    label: 'Orders',    icon: Package,   bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' },
  { href: '/customers', label: 'Customers', icon: Users,     bg: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200' },
  { href: '/staff',     label: 'Staff',     icon: UserCog,   bg: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
  { href: '/services',  label: 'Services',  icon: Shirt,     bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
  { href: '/reports',   label: 'Reports',   icon: BarChart3, bg: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' },
  { href: '/settings',  label: 'Settings',  icon: Settings,  bg: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200' },
];

export default function PlatformDashboard() {
  const { data, isLoading } = useQuery<PlatformData>({
    queryKey: ['analytics', 'platform'],
    queryFn: async () => (await api.get('/analytics/platform')).data,
  });

  if (isLoading) return <p className="text-slate-400">Loading...</p>;
  if (!data) return null;

  const avgPerShop = data.shops.total > 0 ? inr(data.totals.collected / data.shops.total) : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Overview</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2}    label="Total Shops"     value={data.shops.total}           color="blue"    href="/shops" />
        <StatCard icon={CheckCircle2} label="Active Shops"    value={data.shops.active}          color="emerald" href="/shops" />
        <StatCard icon={Clock}        label="Trial Shops"     value={data.shops.trial}           color="amber"   href="/shops" />
        <StatCard icon={XCircle}      label="Inactive Shops"  value={data.shops.inactive}        color="rose"    href="/shops" />
        <StatCard icon={Package}      label="Total Orders"    value={data.totals.orders}         color="indigo"  href="/orders" />
        <StatCard icon={Users}        label="Total Customers" value={data.totals.customers}      color="violet"  href="/customers" />
        <StatCard icon={IndianRupee}  label="Total Revenue"   value={inr(data.totals.collected)} color="green" />
        <StatCard icon={TrendingUp}   label="Avg per Shop"    value={avgPerShop}                 color="sky" />
      </div>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-slate-700">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK.map((a) => (
            <Link key={a.href} href={a.href}
              className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center text-sm font-medium transition ${a.bg}`}>
              <a.icon size={22} />
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-700">
          <TrendingUp size={18} className="text-sky-600" /> Top Shops by Revenue
        </h2>
        {data.leaderboard.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No revenue data yet.</p>
        ) : (
          <div className="space-y-2">
            {data.leaderboard.map((shop, i) => (
              <div key={shop.shopId} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-slate-100 text-slate-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                  }`}>{i + 1}</span>
                  <span className="font-medium text-slate-700">{shop.shopName}</span>
                </div>
                <span className="font-semibold text-emerald-700">{inr(shop.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
