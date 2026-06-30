'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiError } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { dateTime, inr, STATUS_LABEL, ORDER_STATUS_FLOW } from '@/lib/format';
import { Badge, Button, Card } from '@/components/ui';
import { Phone, MapPin, ArrowRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-700', RECEIVED: 'bg-blue-100 text-blue-700',
  WASHING: 'bg-cyan-100 text-cyan-700', DRYING: 'bg-amber-100 text-amber-700',
  IRONING: 'bg-orange-100 text-orange-700', QUALITY_CHECK: 'bg-purple-100 text-purple-700',
  READY: 'bg-emerald-100 text-emerald-700',
};

export default function MyOrdersPage() {
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) =>
      (await api.patch('/orders/' + id + '/status', { status })).data,
    onSuccess: () => { toast.success('Status updated!'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const active = orders.filter((o) =>
    ['CREATED', 'RECEIVED', 'WASHING', 'DRYING', 'IRONING', 'QUALITY_CHECK'].includes(o.status)
  );

  if (isLoading) return <p className="p-6 text-slate-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Orders ({active.length})</h1>
      {active.length === 0 ? (
        <Card className="py-12 text-center"><p className="text-slate-400">No active orders.</p></Card>
      ) : (
        <div className="space-y-3">
          {active.map((o) => {
            const idx = ORDER_STATUS_FLOW.indexOf(o.status as never);
            const next = ORDER_STATUS_FLOW[idx + 1];
            const itemCount = o.items ? o.items.reduce((s, it) => s + it.quantity, 0) : 0;
            return (
              <Card key={o.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={'/orders/' + o.id} className="font-bold text-sky-600 hover:underline">{o.orderNumber}</Link>
                      <span className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (STATUS_COLORS[o.status] || '')}>{STATUS_LABEL[o.status]}</span>
                    </div>
                    <p className="text-sm text-slate-600">{o.customer?.name} · {itemCount} items · {inr(o.grandTotal)}</p>
                    {o.customer?.mobile && (
                      <a href={'tel:' + o.customer.mobile} className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600">
                        <Phone size={11} /> {o.customer.mobile}
                      </a>
                    )}
                    <p className="text-xs text-slate-400">{dateTime(o.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {o.status === 'CREATED' && (
                      <Button className="text-xs" disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: o.id, status: 'RECEIVED' })}>
                        Accept
                      </Button>
                    )}
                    {next && o.status !== 'CREATED' && (
                      <Button className="text-xs" disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: o.id, status: next })}>
                        <ArrowRight size={12} /> {STATUS_LABEL[next]}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
