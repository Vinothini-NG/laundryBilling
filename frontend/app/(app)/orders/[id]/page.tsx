'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, IndianRupee } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useAuth } from '@/lib/store';
import type { Order, OrderStatus, PaymentMode } from '@/lib/types';
import {
  inr,
  dateTime,
  SERVICE_LABEL,
  STATUS_LABEL,
  ORDER_STATUS_FLOW,
} from '@/lib/format';
import { downloadInvoicePdf } from '@/lib/invoicePdf';
import { Badge, Button, Card, Input, Select } from '@/components/ui';

const MODES: PaymentMode[] = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('CASH');

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
  });

  const setStatus = useMutation({
    mutationFn: async (status: OrderStatus) =>
      (await api.patch(`/orders/${id}/status`, { status })).data,
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const pay = useMutation({
    mutationFn: async () =>
      (
        await api.post('/payments', {
          invoiceId: order!.invoice!.id,
          amount: Number(payAmount),
          mode: payMode,
        })
      ).data,
    onSuccess: () => {
      toast.success('Payment recorded');
      setPayAmount('');
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || !order)
    return <p className="text-slate-400">Loading order…</p>;

  const inv = order.invoice;
  const canBill =
    user?.role === 'SHOP_ADMIN' || user?.role === 'BILLING_EXECUTIVE';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-slate-500">
            {order.customer?.name} · {order.customer?.mobile} ·{' '}
            {dateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge value={order.status} />
          <Button variant="secondary" onClick={() => downloadInvoicePdf(order)}>
            <Download size={16} /> Invoice PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-700">Items</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Service</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((it) => (
                <tr key={it.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">
                    {it.itemName}
                  </td>
                  <td className="py-2 text-slate-500">
                    {SERVICE_LABEL[it.serviceType]}
                  </td>
                  <td className="py-2 text-right">{inr(it.unitPrice)}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right font-medium">
                    {inr(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <Line label="Subtotal" value={inr(order.subtotal)} />
            {order.discountAmount > 0 && (
              <Line
                label="Discount"
                value={`– ${inr(order.discountAmount)}`}
              />
            )}
            {order.taxAmount > 0 && (
              <Line label={`GST (${order.gstPercent}%)`} value={inr(order.taxAmount)} />
            )}
            <div className="my-1 border-t border-slate-200" />
            <div className="flex justify-between text-base font-bold text-slate-800">
              <span>Grand total</span>
              <span>{inr(order.grandTotal)}</span>
            </div>
          </div>
        </Card>

        {/* Sidebar: status + payments */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-700">Status</h2>
            <Select
              value={order.status}
              onChange={(e) => setStatus.mutate(e.target.value as OrderStatus)}
            >
              {ORDER_STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Card>

          {inv && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-700">Payment</h2>
                <Badge value={inv.status} />
              </div>
              <div className="space-y-1 text-sm">
                <Line label="Total" value={inr(inv.grandTotal)} />
                <Line label="Paid" value={inr(inv.amountPaid)} />
                <Line label="Balance" value={inr(inv.balance)} />
              </div>

              {canBill && inv.balance > 0 && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <Input
                    label="Amount"
                    type="number"
                    min="0"
                    placeholder={String(inv.balance)}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <Select
                    label="Mode"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                  >
                    {MODES.map((m) => (
                      <option key={m} value={m}>
                        {m.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                  <Button
                    className="w-full"
                    disabled={!payAmount || pay.isPending}
                    onClick={() => pay.mutate()}
                  >
                    <IndianRupee size={16} /> Record payment
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
