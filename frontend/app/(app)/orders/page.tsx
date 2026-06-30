'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import PrintBill from './print-bill';
import type { Order } from '@/lib/types';
import { inr, dateTime } from '@/lib/format';
import { Badge, Card } from '@/components/ui';

export default function OrdersPage() {
  const [printOrder, setPrintOrder] = useState<any>(null);
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Orders</h1>

      <Card className="p-5">
        {isLoading ? (
          <p className="text-slate-400">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Order #</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Payment</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-center">Bill</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3">
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-medium text-sky-600 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">
                      {o.customer?.name ?? '—'}
                    </td>
                    <td className="py-3 text-slate-500">
                      {dateTime(o.createdAt)}
                    </td>
                    <td className="py-3">
                      <Badge value={o.status} />
                    </td>
                    <td className="py-3">
                      {o.invoice ? <Badge value={o.invoice.status} /> : '—'}
                    </td>
                    <td className="py-3 text-right font-medium text-slate-700">
                      {inr(o.grandTotal)}
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => setPrintOrder(o)}
                        className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-200">
                        View Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {printOrder && (
        <PrintBill order={printOrder} onClose={() => setPrintOrder(null)} />
      )}
    </div>
  );
}
