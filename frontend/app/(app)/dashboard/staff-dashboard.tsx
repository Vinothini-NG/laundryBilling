'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Package, CheckCircle2, Clock, IndianRupee, Truck,
  RefreshCw, Phone, MapPin, Search, User, ChevronDown,
  ChevronUp, Eye, ArrowRight,
} from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { Order, OrderStatus, PaymentMode } from '@/lib/types';
import { dateTime, inr, STATUS_LABEL, ORDER_STATUS_FLOW } from '@/lib/format';
import { Badge, Button, Card, Select, Input } from '@/components/ui';
import { useAuth } from '@/lib/store';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-700',
  RECEIVED: 'bg-blue-100 text-blue-700',
  WASHING: 'bg-cyan-100 text-cyan-700',
  DRYING: 'bg-amber-100 text-amber-700',
  IRONING: 'bg-orange-100 text-orange-700',
  QUALITY_CHECK: 'bg-purple-100 text-purple-700',
  READY: 'bg-emerald-100 text-emerald-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const PROCESS_STEPS = [
  { status: 'RECEIVED', label: 'Received', icon: '📦' },
  { status: 'WASHING', label: 'Washing', icon: '🧺' },
  { status: 'DRYING', label: 'Drying', icon: '💨' },
  { status: 'IRONING', label: 'Ironing', icon: '👔' },
  { status: 'QUALITY_CHECK', label: 'Quality Check', icon: '🔍' },
  { status: 'READY', label: 'Ready', icon: '✅' },
  { status: 'DELIVERED', label: 'Delivered', icon: '🚚' },
];

function StatCard({ icon: Icon, label, value, tint }: {
  icon: typeof Package; label: string; value: string | number; tint: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </Card>
  );
}

function ProgressBar({ status }: { status: string }) {
  const currentIdx = PROCESS_STEPS.findIndex((s) => s.status === status);
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {PROCESS_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.status} className="flex items-center">
            <div className={`flex flex-col items-center ${i > 0 ? 'ml-1' : ''}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                done ? 'bg-emerald-500 text-white' :
                active ? 'bg-sky-500 text-white ring-2 ring-sky-300' :
                'bg-slate-100 text-slate-400'
              }`}>
                {done ? '✓' : step.icon}
              </div>
              <span className={`mt-1 text-[10px] ${active ? 'font-bold text-sky-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {i < PROCESS_STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 w-4 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StaffDashboard() {
  const qc = useQueryClient();
  const authUser = useAuth((s) => s.user);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'assigned' | 'ready' | 'delivered' | 'all'>('assigned');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payMode, setPayMode] = useState<PaymentMode>('CASH');
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
    refetchInterval: 30000,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) =>
      (await api.patch(`/orders/${id}/status`, { status })).data,
    onSuccess: () => {
      toast.success('Status updated!');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const collectPayment = useMutation({
    mutationFn: async ({ invoiceId, amount }: { invoiceId: string; amount: number }) =>
      (await api.post('/payments', { invoiceId, amount, mode: payMode })).data,
    onSuccess: () => {
      toast.success('Payment collected!');
      setCollectingId(null);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  // Categorize
  const todayStr = new Date().toDateString();
  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const newOrders = orders.filter((o) => o.status === 'CREATED');
  const inProgress = orders.filter((o) => ['RECEIVED','WASHING','DRYING','IRONING','QUALITY_CHECK'].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === 'READY');
  const deliveredToday = orders.filter((o) => o.status === 'DELIVERED' && new Date(o.createdAt).toDateString() === todayStr);
  const allDelivered = orders.filter((o) => o.status === 'DELIVERED');
  const cashToday = deliveredToday.reduce((s, o) => s + o.grandTotal, 0);
  const pendingAmount = readyOrders.reduce((s, o) => s + (o.invoice?.balance ?? o.grandTotal), 0);

  // Filter by tab
  let shownOrders = orders;
  if (tab === 'assigned') shownOrders = activeOrders;
  else if (tab === 'ready') shownOrders = readyOrders;
  else if (tab === 'delivered') shownOrders = allDelivered;

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    shownOrders = shownOrders.filter((o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.mobile?.includes(q)
    );
  }

  if (isLoading) return <p className="p-6 text-slate-400">Loading...</p>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome, {'Staff'} 👋
          </h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['orders'] })}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={Clock} label="Pending Orders" value={newOrders.length} tint="bg-blue-100 text-blue-600" />
        <StatCard icon={Package} label="In Progress" value={inProgress.length} tint="bg-indigo-100 text-indigo-600" />
        <StatCard icon={Truck} label="Ready to Deliver" value={readyOrders.length} tint="bg-emerald-100 text-emerald-600" />
        <StatCard icon={CheckCircle2} label="Delivered Today" value={deliveredToday.length} tint="bg-green-100 text-green-600" />
        <StatCard icon={IndianRupee} label="Cash Collected" value={inr(cashToday)} tint="bg-amber-100 text-amber-600" />
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {([
            { key: 'assigned', label: 'My Orders', count: activeOrders.length },
            { key: 'ready', label: 'Ready', count: readyOrders.length },
            { key: 'delivered', label: 'Delivered', count: allDelivered.length },
            { key: 'all', label: 'All', count: orders.length },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-sky-400 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {shownOrders.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-slate-400">No orders found.</p>
          </Card>
        ) : (
          shownOrders.map((o) => {
            const balance = o.invoice?.balance ?? o.grandTotal;
            const isPaid = balance <= 0;
            const isExpanded = expandedId === o.id;
            const isCollecting = collectingId === o.id;
            const idx = ORDER_STATUS_FLOW.indexOf(o.status as never);
            const nextStatus = ORDER_STATUS_FLOW[idx + 1];
            const itemCount = o.items ? o.items.reduce((s, it) => s + it.quantity, 0) : 0;

            return (
              <Card key={o.id} className="overflow-hidden">
                {/* Order Header */}
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${STATUS_COLORS[o.status]}`}>
                      {o.status === 'DELIVERED' ? '✓' : o.status === 'READY' ? '📦' : '⏳'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{o.orderNumber}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[o.status]}`}>
                          {STATUS_LABEL[o.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {o.customer?.name} · {itemCount} items · {inr(o.grandTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isPaid && o.status !== 'DELIVERED' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Due: {inr(balance)}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
                    {/* Progress Bar */}
                    {o.status !== 'CANCELLED' && o.status !== 'CREATED' && (
                      <ProgressBar status={o.status} />
                    )}

                    {/* Customer Details */}
                    <div className="rounded-lg bg-white p-3 space-y-2">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <User size={14} /> Customer Details
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-slate-500">Name</p>
                          <p className="font-medium text-slate-800">{o.customer?.name}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Phone</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-800">{o.customer?.mobile}</p>
                            {o.customer?.mobile && (
                              <a href={`tel:${o.customer.mobile}`}
                                className="rounded-full bg-green-100 p-1 text-green-700 hover:bg-green-200">
                                <Phone size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                        {o.customer?.address && (
                          <div className="sm:col-span-2">
                            <p className="text-slate-500">Address</p>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800">{o.customer.address}</p>
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.customer.address)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="rounded-full bg-blue-100 p-1 text-blue-700 hover:bg-blue-200">
                                <MapPin size={12} />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="rounded-lg bg-white p-3">
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">Laundry Items</h3>
                      <table className="w-full text-sm">
                        <thead className="text-xs text-slate-400">
                          <tr><th className="py-1 text-left">Item</th><th className="py-1 text-left">Service</th><th className="py-1 text-right">Qty</th><th className="py-1 text-right">Amount</th></tr>
                        </thead>
                        <tbody>
                          {o.items?.map((it) => (
                            <tr key={it.id} className="border-t border-slate-50">
                              <td className="py-1.5 font-medium text-slate-700">{it.itemName}</td>
                              <td className="py-1.5 text-slate-500">{it.serviceType.replace(/_/g, ' ')}</td>
                              <td className="py-1.5 text-right text-slate-700">{it.quantity}</td>
                              <td className="py-1.5 text-right font-medium text-slate-700">{inr(it.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Billing Summary */}
                    <div className="rounded-lg bg-white p-3">
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">Billing</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{inr(o.subtotal)}</span></div>
                        {o.taxAmount > 0 && <div className="flex justify-between"><span className="text-slate-500">GST ({o.gstPercent}%)</span><span>{inr(o.taxAmount)}</span></div>}
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-bold">
                          <span>Grand Total</span><span>{inr(o.grandTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment Status</span>
                          <span className={isPaid ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
                            {isPaid ? 'PAID' : 'Balance: ' + inr(balance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Collection */}
                    {!isPaid && isCollecting && o.invoice && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Collect Payment: {inr(balance)}</p>
                        <Select label="Payment Mode" value={payMode} onChange={(e) => setPayMode(e.target.value as PaymentMode)}>
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

                    {/* Notes */}
                    {(o as any).notes && (
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                        <p className="text-xs font-semibold text-yellow-800">Special Instructions</p>
                        <p className="text-sm text-yellow-700">{(o as any).notes}</p>
                      </div>
                    )}

                    {/* Order Date */}
                    <p className="text-xs text-slate-400">Created: {dateTime(o.createdAt)}</p>

                    {/* Action Buttons */}
                    {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                        {o.status === 'CREATED' && (
                          <Button disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: o.id, status: 'RECEIVED' })}>
                            📦 Accept Order
                          </Button>
                        )}
                        {nextStatus && o.status !== 'CREATED' && (
                          <Button disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: o.id, status: nextStatus })}>
                            <ArrowRight size={14} /> {STATUS_LABEL[nextStatus]}
                          </Button>
                        )}
                        {o.status === 'READY' && (
                          <Button disabled={setStatus.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setStatus.mutate({ id: o.id, status: 'DELIVERED' })}>
                            <Truck size={14} /> Mark Delivered
                          </Button>
                        )}
                        {!isPaid && !isCollecting && o.invoice && (
                          <Button variant="secondary"
                            className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            onClick={() => setCollectingId(o.id)}>
                            <IndianRupee size={14} /> Collect Payment
                          </Button>
                        )}
                        {o.customer?.mobile && (
                          <a href={`tel:${o.customer.mobile}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <Phone size={14} /> Call Customer
                          </a>
                        )}
                        {o.customer?.address && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.customer.address)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <MapPin size={14} /> Navigate
                          </a>
                        )}
                        <Link href={`/orders/${o.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                          <Eye size={14} /> Full Details
                        </Link>
                      </div>
                    )}

                    {/* Delivered order summary */}
                    {o.status === 'DELIVERED' && (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <CheckCircle2 size={16} />
                        <span className="font-medium">
                          Delivered {(o as any).deliveredAt ? dateTime((o as any).deliveredAt) : ''} · {isPaid ? 'Paid' : 'Balance: ' + inr(balance)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
