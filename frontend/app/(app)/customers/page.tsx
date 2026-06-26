'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { dateShort } from '@/lib/format';
import { Button, Card, Input } from '@/components/ui';

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
  });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: async () =>
      (await api.get('/customers', { params: { search: search || undefined } }))
        .data,
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post('/customers', { ...form, email: form.email || undefined }))
        .data,
    onSuccess: () => {
      toast.success('Customer added');
      setForm({ name: '', mobile: '', email: '', address: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Add customer
        </Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Input label="Name" value={form.name} onChange={set('name')} required />
            <Input
              label="Mobile"
              value={form.mobile}
              onChange={set('mobile')}
              required
            />
            <Input label="Email" value={form.email} onChange={set('email')} />
            <Input
              label="Address"
              value={form.address}
              onChange={set('address')}
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Save customer'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-5">
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or mobile…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500"
          />
        </div>

        {isLoading ? (
          <p className="text-slate-400">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No customers yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Mobile</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Since</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium text-slate-700">{c.name}</td>
                    <td className="py-3 text-slate-600">{c.mobile}</td>
                    <td className="py-3 text-slate-500">{c.email ?? '—'}</td>
                    <td className="py-3 text-slate-500">
                      {dateShort(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
