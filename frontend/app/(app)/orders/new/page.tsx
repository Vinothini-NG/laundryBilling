'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { computeBill } from '@/lib/billing';
import type {
  Customer,
  DiscountType,
  GstMode,
  Service,
  ServiceType,
} from '@/lib/types';
import { inr, SERVICE_LABEL } from '@/lib/format';
import { Button, Card, Input, Select } from '@/components/ui';

interface Line {
  key: string;
  serviceId?: string;
  itemName: string;
  serviceType: ServiceType;
  unitPrice: number;
  quantity: number;
}

let lineSeq = 0;

export default function NewOrderPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);

  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', mobile: '', email: '', address: '' });
  const [lines, setLines] = useState<Line[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState(0);
  const [charges, setCharges] = useState({
    expressCharge: 0,
    pickupCharge: 0,
    deliveryCharge: 0,
    specialHandling: 0,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers')).data,
  });
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/services')).data,
  });
  const { data: shop } = useQuery({
    queryKey: ['shop', user?.shopId],
    queryFn: async () => (await api.get(`/shops/${user!.shopId}`)).data,
    enabled: !!user?.shopId,
  });

  const gstMode: GstMode = shop?.gstMode ?? 'NONE';
  const gstPercent: number = shop?.gstPercent ?? 0;

  const bill = useMemo(
    () =>
      computeBill({
        lines: lines.map((l) => ({
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        })),
        discountType,
        discountValue,
        ...charges,
        gstMode,
        gstPercent,
      }),
    [lines, discountType, discountValue, charges, gstMode, gstPercent],
  );

  function addLine(serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    setLines((ls) => [
      ...ls,
      {
        key: `l${lineSeq++}`,
        serviceId: svc.id,
        itemName: svc.itemName,
        serviceType: svc.serviceType,
        unitPrice: svc.price,
        quantity: 1,
      },
    ]);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key: string) {
    setLines((ls) => ls.filter((l) => l.key !== key));
  }

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/orders', {
          customerId,
          items: lines.map((l) => ({
            serviceId: l.serviceId,
            itemName: l.itemName,
            serviceType: l.serviceType,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
          })),
          discountType,
          discountValue,
          ...charges,
        })
      ).data,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} created`);
      router.push(`/orders/${order.id}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const canSubmit = customerId && lines.length > 0 && !create.isPending;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">New Order</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: order builder */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.mobile}
                    </option>
                  ))}
                </Select>
              </div>
              <button
                onClick={() => setShowAddCustomer(true)}
                className="mb-[2px] flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                title="Add New Customer"
              >
                <Plus size={20} />
              </button>
            </div>
            {showAddCustomer && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <h3 className="font-semibold text-slate-700">Add New Customer</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Name *" placeholder="Customer name" value={newCust.name}
                    onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
                  <Input label="Mobile *" placeholder="9876543210" value={newCust.mobile}
                    onChange={(e) => setNewCust({ ...newCust, mobile: e.target.value })} />
                  <Input label="Email" placeholder="email@example.com" value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} />
                  <Input label="Address" placeholder="Full address" value={newCust.address}
                    onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!newCust.name || !newCust.mobile}
                    onClick={async () => {
                      try {
                        const res = await api.post('/customers', newCust);
                        toast.success('Customer added!');
                        setCustomerId(res.data.id);
                        setShowAddCustomer(false);
                        setNewCust({ name: '', mobile: '', email: '', address: '' });
                        qc.invalidateQueries({ queryKey: ['customers'] });
                      } catch (e) { toast.error(apiError(e)); }
                    }}>
                    <Plus size={14} /> Add Customer
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Items</h2>
              <Select
                value=""
                onChange={(e) => e.target.value && addLine(e.target.value)}
                className="w-56"
              >
                <option value="">+ Add item from price list</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.itemName} · {SERVICE_LABEL[s.serviceType]} · {inr(s.price)}
                  </option>
                ))}
              </Select>
            </div>

            {lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Add items to start billing.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2">Item</th>
                    <th className="py-2">Service</th>
                    <th className="py-2 w-24">Price</th>
                    <th className="py-2 w-20">Qty</th>
                    <th className="py-2 text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.key} className="border-t border-slate-100">
                      <td className="py-2 font-medium text-slate-700">
                        {l.itemName}
                      </td>
                      <td className="py-2 text-slate-500">
                        {SERVICE_LABEL[l.serviceType]}
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={l.unitPrice}
                          onChange={(e) =>
                            updateLine(l.key, {
                              unitPrice: Number(e.target.value),
                            })
                          }
                          className="w-20 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="1"
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(l.key, {
                              quantity: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-16 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="py-2 text-right font-medium text-slate-700">
                        {inr(l.unitPrice * l.quantity)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => removeLine(l.key)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-700">
              Discount & charges
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Select
                label="Discount type"
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as DiscountType)
                }
              >
                <option value="NONE">None</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (₹)</option>
              </Select>
              <Input
                label="Discount value"
                type="number"
                min="0"
                value={discountValue}
                disabled={discountType === 'NONE'}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
              <Input
                label="Express (₹)"
                type="number"
                min="0"
                value={charges.expressCharge}
                onChange={(e) =>
                  setCharges({ ...charges, expressCharge: Number(e.target.value) })
                }
              />
              <Input
                label="Pickup (₹)"
                type="number"
                min="0"
                value={charges.pickupCharge}
                onChange={(e) =>
                  setCharges({ ...charges, pickupCharge: Number(e.target.value) })
                }
              />
              <Input
                label="Delivery (₹)"
                type="number"
                min="0"
                value={charges.deliveryCharge}
                onChange={(e) =>
                  setCharges({
                    ...charges,
                    deliveryCharge: Number(e.target.value),
                  })
                }
              />
              <Input
                label="Special handling (₹)"
                type="number"
                min="0"
                value={charges.specialHandling}
                onChange={(e) =>
                  setCharges({
                    ...charges,
                    specialHandling: Number(e.target.value),
                  })
                }
              />
            </div>
          </Card>
        </div>

        {/* Right: live bill summary */}
        <div>
          <Card className="sticky top-6 p-5">
            <h2 className="mb-4 font-semibold text-slate-700">Bill summary</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={inr(bill.subtotal)} />
              {bill.discountAmount > 0 && (
                <Row
                  label="Discount"
                  value={`– ${inr(bill.discountAmount)}`}
                  tint="text-emerald-600"
                />
              )}
              {bill.charges > 0 && (
                <Row label="Charges" value={inr(bill.charges)} />
              )}
              {bill.taxAmount > 0 && (
                <Row
                  label={`GST (${gstPercent}% ${gstMode === 'INCLUSIVE' ? 'incl.' : 'excl.'})`}
                  value={inr(bill.taxAmount)}
                />
              )}
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between text-lg font-bold text-slate-800">
                <span>Grand total</span>
                <span>{inr(bill.grandTotal)}</span>
              </div>
            </dl>

            <Button
              className="mt-5 w-full"
              disabled={!canSubmit}
              onClick={() => create.mutate()}
            >
              <Plus size={16} />
              {create.isPending ? 'Creating…' : 'Create order & invoice'}
            </Button>
            {!customerId && (
              <p className="mt-2 text-center text-xs text-slate-400">
                Select a customer to continue
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={tint ?? 'text-slate-700'}>{value}</dd>
    </div>
  );
}
