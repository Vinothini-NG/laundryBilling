'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Truck, CheckCircle2, Clock, IndianRupee,
  Phone, Package, UserCog, MapPin,
} from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { Order, OrderStatus, PaymentMode } from '@/lib/types';
import { dateTime, inr, STATUS_LABEL } from '@/lib/format';
import { Badge, Button, Card, Select } from '@/components/ui';
import { useAuth } from '@/lib/store';

interface StaffUser { id: string; name: string; role: string; }

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];

export default function DeliveriesPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === 'SHOP_ADMIN';
  const [tab, setTab] = useState<'ready' | 'inprogress' | 'delivered'>('ready');
  const [payMode, setPayMode] = useState<PaymentMode>('CASH');
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
    refetchInterval: 15000,
  });

  const { data: staffList = [] } = useQuery<StaffUser[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: isAdmin,
  });

  const deliveryStaff = staffList.filter(
    (s) => s.role === 'LAUNDRY_STAFF' || s.role === 'BILLING_EXECUTIVE'
  );

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) =>
      (await api.patch('/orders/' + id + '/status', { status })).data,
    onSuccess: () => { toast.success('Status updated!'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const assignStaff = useMutation({
    mutationFn: async ({ orderId, staffId }: { orderId: string; staffId: string }) =>
      (await api.patch('/orders/' + orderId + '/assign', { assignedToId: staffId })).data,
    onSuccess: () => {
      toast.success('Staff assigned!');
      setAssigningId(null);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const collectPayment = useMutation({
    mutationFn: async ({ invoiceId, amount }: { invoiceId: string; amount: number }) =>
      (await api.post('/payments', { invoiceId, amount, mode: payMode })).data,
    onSuccess: () => { toast.success('Payment collected!'); setCollectingId(null); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const readyOrders = orders.filter((o) => o.status === 'READY');
  const inProgressOrders = orders.filter((o) =>
    ['CREATED', 'RECEIVED', 'WASHING', 'DRYING', 'IRONING', 'QUALITY_CHECK'].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const todayStr = new Date().toDateString();
  const deliveredToday = deliveredOrders.filter((o) => new Date(o.createdAt).toDateString() === todayStr);
  const totalCollected = deliveredToday.reduce((s, o) => s + o.grandTotal, 0);
  const pendingAmount = readyOrders.reduce((s, o) => s + (o.invoice?.balance ?? o.grandTotal), 0);

  const shown = tab === 'ready' ? readyOrders : tab === 'inprogress' ? inProgressOrders : deliveredOrders;

  if (isLoading) return <p className="p-6 text-slate-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Deliveries & Assignments</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Package size={20} /></div>
          <div><p className="text-sm text-slate-500">Ready</p><p className="text-xl font-bold text-slate-800">{readyOrders.length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Clock size={20} /></div>
          <div><p className="text-sm text-slate-500">In Progress</p><p className="text-xl font-bold text-slate-800">{inProgressOrders.length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><CheckCircle2 size={20} /></div>
          <div><p className="text-sm text-slate-500">Delivered Today</p><p className="text-xl font-bold text-slate-800">{deliveredToday.length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600"><IndianRupee size={20} /></div>
          <div><p className="text-sm text-slate-500">Collected Today</p><p className="text-xl font-bold text-slate-800">{inr(totalCollected)}</p></div>
        </Card>
      </div>

      <div className="flex gap-2">
        {(['ready', 'inprogress', 'delivered'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {t === 'ready' ? 'Ready (' + readyOrders.length + ')' :
             t === 'inprogress' ? 'In Progress (' + inProgressOrders.length + ')' :
             'Delivered (' + deliveredOrders.length + ')'}
          </button>
        ))}
      </div>

      <Card className="p-5">
        {shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No orders in this category.</p>
        ) : (
          <div className="space-y-4">
            {shown.map((o) => {
              const balance = o.invoice?.balance ?? o.grandTotal;
              const isPaid = balance <= 0;
              const isCollecting = collectingId === o.id;
              const isAssigning = assigningId === o.id;

              return (
                <div key={o.id} className={`rounded-xl border p-4 ${
                  tab === 'delivered' ? 'border-green-200 bg-green-50' :
                  tab === 'ready' ? 'border-amber-200 bg-amber-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={'/orders/' + o.id} className="font-bold text-sky-600 hover:underline">{o.orderNumber}</Link>
                        <Badge value={o.status} />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{o.customer?.name}</p>
                      {o.customer?.mobile && (
                        <a href={'tel:' + o.customer.mobile} className="flex items-center gap-1 text-sm text-slate-500 hover:text-sky-600">
                          <Phone size={12} /> {o.customer.mobile}
                        </a>
                      )}
                      <p className="mt-1 text-xs text-slate-400">{dateTime(o.createdAt)}</p>

                      {/* Assigned Staff Badge */}
                      {o.assignedTo && (
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                          <UserCog size={12} />
                          {tab === 'delivered' ? 'Delivered by: ' : 'Assigned to: '}
                          {o.assignedTo.name}
                        </p>
                      )}
                      {tab !== 'delivered' && !o.assignedTo && (
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                          Not assigned
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800">{inr(o.grandTotal)}</p>
                      {isPaid
                        ? <span className="text-xs font-semibold text-emerald-600">Paid</span>
                        : <p className="text-sm font-semibold text-amber-600">Collect: {inr(balance)}</p>
                      }
                    </div>
                  </div>

                  {/* Items */}
                  {o.items && o.items.length > 0 && (
                    <div className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-600">
                      {o.items.map((it) => (
                        <span key={it.id} className="mr-2 inline-block rounded bg-slate-100 px-2 py-0.5">
                          {it.itemName} x{it.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Assign Panel */}
                  {isAdmin && isAssigning && (
                    <div className="mt-3 space-y-2 rounded-lg border border-indigo-200 bg-white p-3">
                      <p className="text-sm font-medium text-slate-700">Assign Staff Member</p>
                      <Select label="Select Staff" defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) assignStaff.mutate({ orderId: o.id, staffId: e.target.value });
                        }}>
                        <option value="">-- Choose staff --</option>
                        {deliveryStaff.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>
                        ))}
                      </Select>
                      <Button variant="secondary" className="text-xs" onClick={() => setAssigningId(null)}>Cancel</Button>
                    </div>
                  )}

                  {/* Payment Panel */}
                  {!isPaid && isCollecting && o.invoice && (
                    <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-white p-3">
                      <p className="text-sm font-medium text-slate-700">Collect {inr(balance)}</p>
                      <Select label="Payment Mode" value={payMode}
                        onChange={(e) => setPayMode(e.target.value as PaymentMode)}>
                        {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                      </Select>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
                          disabled={collectPayment.isPending}
                          onClick={() => collectPayment.mutate({ invoiceId: o.invoice!.id, amount: balance })}>
                          Confirm {inr(balance)}
                        </Button>
                        <Button variant="secondary" onClick={() => setCollectingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {tab !== 'delivered' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isAdmin && !isAssigning && (
                        <Button variant="secondary"
                          className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          onClick={() => setAssigningId(o.id)}>
                          <UserCog size={14} /> {o.assignedTo ? 'Reassign' : 'Assign Staff'}
                        </Button>
                      )}
                      {!isPaid && !isCollecting && o.invoice && (
                        <Button variant="secondary"
                          className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          onClick={() => setCollectingId(o.id)}>
                          <IndianRupee size={14} /> Collect Payment
                        </Button>
                      )}
                      {tab === 'ready' && (
                        <Button disabled={setStatus.isPending}
                          onClick={() => setStatus.mutate({ id: o.id, status: 'DELIVERED' })}>
                          <CheckCircle2 size={14} /> Mark Delivered
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
