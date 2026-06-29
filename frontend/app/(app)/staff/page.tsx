'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, UserCheck, UserX, Key } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { dateShort } from '@/lib/format';
import { Button, Card, Input, Select } from '@/components/ui';

interface ShopRow { id: string; name: string; }
interface StaffUser {
  id: string; name: string; email: string;
  role: string; isActive: boolean; createdAt: string;
}

const ROLES = ['SHOP_ADMIN', 'BILLING_EXECUTIVE', 'LAUNDRY_STAFF'];

export default function StaffPage() {
  const qc = useQueryClient();
  const [shopId, setShopId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'LAUNDRY_STAFF' });

  const { data: shops = [] } = useQuery<ShopRow[]>({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/shops')).data,
  });

  const { data: staff = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ['users', shopId],
    queryFn: async () => (await api.get('/users?shopId=' + shopId)).data,
    enabled: !!shopId,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/users', { ...form, shopId })).data,
    onSuccess: () => {
      toast.success('Staff created');
      setForm({ name: '', email: '', password: '', role: 'LAUNDRY_STAFF' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['users', shopId] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const toggle = useMutation({
    mutationFn: async (u: StaffUser) =>
      (await api.patch('/users/' + u.id, { isActive: !u.isActive })).data,
    onSuccess: () => {
      toast.success('Updated');
      qc.invalidateQueries({ queryKey: ['users', shopId] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
        {shopId && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Add Staff
          </Button>
        )}
      </div>
      <Card className="p-5">
        <Select label="Select Shop to manage" value={shopId}
          onChange={(e) => { setShopId(e.target.value); setShowForm(false); }}>
          <option value="">-- Select a shop --</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Card>
      {showForm && shopId && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-700">Add New Staff Member</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Password" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select label="Role" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
          <div className="mt-4 flex gap-3">
            <Button disabled={create.isPending} onClick={() => create.mutate()}>Create Staff</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}
      {shopId && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-700">Staff Members ({staff.length})</h2>
          {isLoading ? <p className="text-slate-400">Loading...</p> : staff.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No staff found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2">Name</th><th className="py-2">Email</th>
                    <th className="py-2">Role</th><th className="py-2">Status</th>
                    <th className="py-2">Joined</th><th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-700">{u.name}</td>
                      <td className="py-3 text-slate-500">{u.email}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{dateShort(u.createdAt)}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button variant={u.isActive ? 'danger' : 'secondary'} className="text-xs"
                            onClick={() => toggle.mutate(u)}>
                            {u.isActive ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                          </Button>
                          <Button variant="secondary" className="text-xs"
                            onClick={() => {
                              const pwd = window.prompt('New password (min 6 chars):');
                              if (!pwd) return;
                              if (pwd.length < 6) { toast.error('Min 6 characters'); return; }
                              api.patch('/users/' + u.id, { password: pwd })
                                .then(() => toast.success('Password reset'))
                                .catch(() => toast.error('Failed'));
                            }}>
                            <Key size={12} /> Reset
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
