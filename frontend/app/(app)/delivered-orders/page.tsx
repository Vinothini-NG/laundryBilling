'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';
import { dateTime, inr } from '@/lib/format';
import { Badge, Card } from '@/components/ui';
import { CheckCircle2, IndianRupee } from 'lucide-react';

export default function DeliveredOrdersPage() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  const delivered = orders.filter((o) => o.status === 'DELIVERED');
  const todayStr = new Date().toDateString();
  const deliveredToday = delivered.filter((o) => new Date(o.createdAt).toDateString() === todayStr);
  const totalToday = deliveredToday.reduce((s, o) => s + o.grandTotal, 0);

  if (isLoading) return <p className="p-6 text-slate-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Delivered Orders</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600"><CheckCircle2 size={20} /></div>
          <div><p className="text-sm text-slate-500">Delivered Today</p><p className="text-xl font-bold text-slate-800">{deliveredToday.length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><IndianRupee size={20} /></div>
          <div><p className="text-sm text-slate-500">Collected Today</p><p className="text-xl font-bold text-slate-800">{inr(totalToday)}</p></div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-slate-700">All Delivered ({delivered.length})</h2>
        {delivered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No delivered orders yet.</p>
        ) : (
          <div className="space-y-2">
            {delivered.map((o) => {
              const balance = o.invoice?.balance ?? o.grandTotal;
              const isPaid = balance <= 0;
              return (
                <div key={o.id} className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <div>
                    <Link href={'/orders/' + o.id} className="font-medium text-sky-600 hover:underline">{o.orderNumber}</Link>
                    <p className="text-sm text-slate-500">{o.customer?.name} · {dateTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">{inr(o.grandTotal)}</p>
                    <span className={'text-xs font-semibold ' + (isPaid ? 'text-emerald-600' : 'text-amber-600')}>
                      {isPaid ? 'Paid' : 'Due: ' + inr(balance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
