'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { inr, dateShort } from '@/lib/format';
import { Badge, Button, Card, Input } from '@/components/ui';

interface ShopRow {
  id: string;
  name: string;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  _count: { orders: number; customers: number; users: number };
}

export default function ShopsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const { data: shops = [], isLoading } = useQuery<ShopRow[]>({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/shops')).data,
  });
  const { data: platform } = useQuery({
    queryKey: ['analytics', 'platform'],
    queryFn: async () => (await api.get('/analytics/platform')).data,
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/shops', {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success('Shop created');
      setForm({ name: '', email: '', phone: '' });
      qc.invalidateQueries({ queryKey: ['shops'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const toggle = useMutation({
    mutationFn: async (s: ShopRow) =>
      (
        await api.patch(`/shops/${s.id}/status`, {
          status: s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Shops</h1>

      {platform && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total shops" value={platform.shops.total} />
          <Stat label="Active" value={platform.shops.active} />
          <Stat label="Total orders" value={platform.totals.orders} />
          <Stat label="Collected" value={inr(platform.totals.collected)} />
        </div>
      )}

      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4"
        >
          <Input
            label="Shop name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Button type="submit" disabled={create.isPending}>
            <Plus size={16} /> Create shop
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        {isLoading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Shop</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Orders</th>
                <th className="py-2 text-right">Customers</th>
                <th className="py-2">Since</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-700">{s.name}</td>
                  <td className="py-3 text-slate-500">{s.subscriptionPlan}</td>
                  <td className="py-3">
                    <Badge value={s.status} />
                  </td>
                  <td className="py-3 text-right">{s._count.orders}</td>
                  <td className="py-3 text-right">{s._count.customers}</td>
                  <td className="py-3 text-slate-500">
                    {dateShort(s.createdAt)}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant={s.status === 'ACTIVE' ? 'danger' : 'secondary'}
                      onClick={() => toggle.mutate(s)}
                    >
                      {s.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </Card>
  );
}
