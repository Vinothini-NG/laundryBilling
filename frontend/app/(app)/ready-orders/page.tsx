'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiError } from '@/lib/api';
import type { Order, OrderStatus, PaymentMode } from '@/lib/types';
import { dateTime, inr } from '@/lib/format';
import { Button, Card, Select } from '@/components/ui';
import { CheckCircle2, IndianRupee, Phone, Truck } from 'lucide-react';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];

export default function ReadyOrdersPage() {
  const qc = useQueryClient();
  const [payMode, setPayMode] = useState<PaymentMode>('CASH');
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) =>
      (await api.patch('/orders/' + id + '/status', { status })).data,
    onSuccess: () => { toast.success('Delivered!'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const collectPayment = useMutation({
    mutationFn: async ({ invoiceId, amount }: { invoiceId: string; amount: number }) =>
      (await api.post('/payments', { invoiceId, amount, mode: payMode })).data,
    onSuccess: () => { toast.success('Payment collected!'); setCollectingId(null); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const ready = orders.filter((o) => o.status === 'READY');

  if (isLoading) return <p className="p-6 text-slate-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Ready for Delivery ({ready.length})</h1>
      {ready.length === 0 ? (
        <Card className="py-12 text-center"><p className="text-slate-400">No orders ready for delivery.</p></Card>
      ) : (
        <div className="space-y-4">
          {ready.map((o) => {
            const balance = o.invoice?.balance ?? o.grandTotal;
            const isPaid = balance <= 0;
            const isCollecting = collectingId === o.id;
            return (
              <Card key={o.id} className="border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={'/orders/' + o.id} className="font-bold text-sky-600 hover:underline">{o.orderNumber}</Link>
                    <p className="text-sm font-semibold text-slate-700">{o.customer?.name}</p>
                    {o.customer?.mobile && (
                      <a href={'tel:' + o.customer.mobile} className="flex items-center gap-1 text-sm text-slate-500 hover:text-sky-600">
                        <Phone size={12} /> {o.customer.mobile}
                      </a>
                    )}
                    <p className="text-xs text-slate-400">{dateTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">{inr(o.grandTotal)}</p>
                    {isPaid ? <span className="text-xs font-semibold text-emerald-600">Paid</span>
                      : <p className="text-sm font-semibold text-amber-600">Collect: {inr(balance)}</p>}
                  </div>
                </div>
                {o.items && o.items.length > 0 && (
                  <div className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-600">
                    {o.items.map((it) => <span key={it.id} className="mr-2 inline-block rounded bg-slate-100 px-2 py-0.5">{it.itemName} x{it.quantity}</span>)}
                  </div>
                )}
                {!isPaid && isCollecting && o.invoice && (
                  <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-white p-3">
                    <p className="text-sm font-medium text-slate-700">Collect {inr(balance)}</p>
                    <Select label="Payment Mode" value={payMode} onChange={(e) => setPayMode(e.target.value as PaymentMode)}>
                      {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                    </Select>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-amber-500 text-white hover:bg-amber-600" disabled={collectPayment.isPending}
                        onClick={() => collectPayment.mutate({ invoiceId: o.invoice!.id, amount: balance })}>
                        Confirm {inr(balance)}
                      </Button>
                      <Button variant="secondary" onClick={() => setCollectingId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {!isPaid && !isCollecting && o.invoice && (
                    <Button variant="secondary" className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      onClick={() => setCollectingId(o.id)}>
                      <IndianRupee size={14} /> Collect Payment
                    </Button>
                  )}
                  <Button disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: o.id, status: 'DELIVERED' })}>
                    <Truck size={14} /> Mark Delivered
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
