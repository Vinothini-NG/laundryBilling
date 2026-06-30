'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { dateTime, inr, STATUS_LABEL } from '@/lib/format';
import { Badge, Card, Select } from '@/components/ui';
import {
  Package, Users, IndianRupee, CheckCircle2,
  Clock, Phone, MapPin,
} from 'lucide-react';
import type { Order } from '@/lib/types';

interface ShopRow { id: string; name: string; status: string; }

export default function ShopOrdersPage() {
  const [shopId, setShopId] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const { data: shops = [] } = useQuery<ShopRow[]>({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/shops')).data,
  });

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', shopId],
    queryFn: async () => (await api.get('/orders?shopId=' + shopId)).data,
    enabled: !!shopId,
  });

  // Filter by selected date
  const filtered = orders.filter((o) => {
    const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
    return orderDate === dateFilter;
  });

  const delivered = filtered.filter((o) => o.status === 'DELIVERED');
  const pending = filtered.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const totalRevenue = filtered.reduce((s, o) => s + o.grandTotal, 0);
  const collected = delivered.reduce((s, o) => s + o.grandTotal, 0);
  const pendingAmount = filtered.reduce((s, o) => s + (o.invoice?.balance ?? o.grandTotal), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Shop Orders</h1>

      {/* Filters */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Select Shop" value={shopId}
            onChange={(e) => setShopId(e.target.value)}>
            <option value="">-- Choose a shop --</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input type="date" value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none" />
          </div>
        </div>
      </Card>

      {shopId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Package size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Orders</p>
                <p className="text-lg font-bold text-slate-800">{filtered.length}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Delivered</p>
                <p className="text-lg font-bold text-slate-800">{delivered.length}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-lg font-bold text-slate-800">{pending.length}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <IndianRupee size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Revenue</p>
                <p className="text-lg font-bold text-slate-800">{inr(totalRevenue)}</p>
              </div>
            </Card>
          </div>

          {/* Orders List */}
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-700">
              Orders on {new Date(dateFilter).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ({filtered.length})
            </h2>

            {isLoading ? (
              <p className="text-slate-400">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No orders on this date.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((o) => {
                  const balance = o.invoice?.balance ?? o.grandTotal;
                  const isPaid = balance <= 0;
                  return (
                    <div key={o.id} className={`rounded-xl border p-4 ${
                      o.status === 'DELIVERED' ? 'border-green-200 bg-green-50' :
                      o.status === 'READY' ? 'border-amber-200 bg-amber-50' :
                      o.status === 'CANCELLED' ? 'border-rose-200 bg-rose-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={'/orders/' + o.id}
                              className="font-bold text-sky-600 hover:underline">{o.orderNumber}</Link>
                            <Badge value={o.status} />
                          </div>

                          {/* Customer Details */}
                          <div className="mt-2 space-y-1">
                            <p className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                              <Users size={13} /> {o.customer?.name || 'Walk-in'}
                            </p>
                            {o.customer?.mobile && (
                              <a href={'tel:' + o.customer.mobile}
                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-sky-600">
                                <Phone size={12} /> +91-{o.customer.mobile}
                              </a>
                            )}
                          </div>

                          {/* Assigned Staff */}
                          {o.assignedTo && (
                            <p className="mt-1 text-xs text-indigo-600 font-medium">
                              Assigned: {o.assignedTo.name}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-slate-400">{dateTime(o.createdAt)}</p>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">{inr(o.grandTotal)}</p>
                          {isPaid
                            ? <span className="text-xs font-semibold text-emerald-600">Paid</span>
                            : <p className="text-xs font-semibold text-amber-600">Due: {inr(balance)}</p>
                          }
                        </div>
                      </div>

                      {/* Items */}
                      {o.items && o.items.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {o.items.map((it) => (
                            <span key={it.id}
                              className="rounded bg-white px-2 py-0.5 text-xs text-slate-600 border border-slate-100">
                              {it.itemName} x{it.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Summary Table */}
          {filtered.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-4 font-semibold text-slate-700">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Total Orders</span>
                  <span className="font-semibold">{filtered.length}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Delivered</span>
                  <span className="font-semibold text-emerald-600">{delivered.length}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Pending</span>
                  <span className="font-semibold text-amber-600">{pending.length}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Total Revenue</span>
                  <span className="font-bold">{inr(totalRevenue)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Collected</span>
                  <span className="font-semibold text-emerald-600">{inr(collected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending Amount</span>
                  <span className="font-semibold text-amber-600">{inr(pendingAmount)}</span>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
