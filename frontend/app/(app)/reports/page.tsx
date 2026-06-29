'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Building2, Package, Users, IndianRupee, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { Card, Button } from '@/components/ui';

interface PlatformData {
  shops: { total: number; active: number; trial: number; inactive: number };
  totals: { orders: number; customers: number; collected: number };
  leaderboard: { shopId: string; shopName: string; revenue: number }[];
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  const { data, isLoading } = useQuery<PlatformData>({
    queryKey: ['analytics', 'platform'],
    queryFn: async () => (await api.get('/analytics/platform')).data,
  });

  if (isLoading) return <p className="text-slate-400">Loading reports...</p>;
  if (!data) return null;

  const pieData = [
    { name: 'Active',   value: data.shops.active },
    { name: 'Trial',    value: data.shops.trial },
    { name: 'Inactive', value: data.shops.inactive },
  ].filter((d) => d.value > 0);

  const STATS = [
    { icon: Building2,   label: 'Total Shops',     value: data.shops.total,           bg: 'bg-blue-100 text-blue-600' },
    { icon: Package,     label: 'Total Orders',    value: data.totals.orders,         bg: 'bg-indigo-100 text-indigo-600' },
    { icon: Users,       label: 'Total Customers', value: data.totals.customers,      bg: 'bg-violet-100 text-violet-600' },
    { icon: IndianRupee, label: 'Total Revenue',   value: inr(data.totals.collected), bg: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <Button variant="secondary" onClick={() => window.print()}>
          <Download size={16} /> Print / Export
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-700">Shop Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-700">Revenue by Shop</h2>
          {data.leaderboard.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.leaderboard}>
                <XAxis dataKey="shopName" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => inr(v)} />
                <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-slate-700">Revenue Details</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2">#</th><th className="py-2">Shop Name</th>
              <th className="py-2 text-right">Revenue</th><th className="py-2 text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((s, i) => (
              <tr key={s.shopId} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="py-3 text-slate-400">{i + 1}</td>
                <td className="py-3 font-medium text-slate-700">{s.shopName}</td>
                <td className="py-3 text-right font-semibold text-emerald-700">{inr(s.revenue)}</td>
                <td className="py-3 text-right text-slate-500">
                  {data.totals.collected > 0 ? ((s.revenue / data.totals.collected) * 100).toFixed(1) + '%' : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
