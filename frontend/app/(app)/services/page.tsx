'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { Service, ServiceType } from '@/lib/types';
import { inr, SERVICE_LABEL } from '@/lib/format';
import { Button, Card, Input, Select } from '@/components/ui';

const TYPES: ServiceType[] = ['WASH', 'IRON', 'WASH_AND_IRON', 'DRY_CLEAN'];

export default function ServicesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    itemName: '',
    serviceType: 'WASH' as ServiceType,
    price: '',
  });

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/services')).data,
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post('/services', {
          itemName: form.itemName,
          serviceType: form.serviceType,
          price: Number(form.price),
        })
      ).data,
    onSuccess: () => {
      toast.success('Service added');
      setForm({ itemName: '', serviceType: 'WASH', price: '' });
      qc.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Services & Pricing</h1>

      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4"
        >
          <Input
            label="Item"
            placeholder="Shirt"
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            required
          />
          <Select
            label="Service"
            value={form.serviceType}
            onChange={(e) =>
              setForm({ ...form, serviceType: e.target.value as ServiceType })
            }
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {SERVICE_LABEL[t]}
              </option>
            ))}
          </Select>
          <Input
            label="Price (₹)"
            type="number"
            min="0"
            step="0.5"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <Button type="submit" disabled={create.isPending}>
            <Plus size={16} /> Add
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        {isLoading ? (
          <p className="text-slate-400">Loading…</p>
        ) : services.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No services yet — add your price list above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Service</th>
                <th className="py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-700">
                    {s.itemName}
                  </td>
                  <td className="py-3 text-slate-600">
                    {SERVICE_LABEL[s.serviceType]}
                  </td>
                  <td className="py-3 text-right font-medium text-slate-700">
                    {inr(s.price)}
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
