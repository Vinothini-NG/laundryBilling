'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, UserCheck, UserX, Key, Users } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { dateShort } from '@/lib/format';
import { Button, Card, Input, Select } from '@/components/ui';

interface StaffUser {
  id: string; name: string; email: string;
  role: string; isActive: boolean; createdAt: string;
}

const ROLES = ['BILLING_EXECUTIVE', 'LAUNDRY_STAFF'];

export default function ShopStaffPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'LAUNDRY_STAFF' });

  const { data: staff = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/users', form)).data,
    onSuccess: () => {
      toast.success('Staff member added!');
      setForm({ name: '', email: '', password: '', role: 'LAUNDRY_STAFF' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const toggle = useMutation({
    mutationFn: async (u: StaffUser) =>
      (await api.patch('/users/' + u.id, { isActive: !u.isActive })).data,
    onSuccess: () => {
      toast.success('Updated!');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const activeStaff = staff.filter((u) => u.isActive);
  const inactiveStaff = staff.filter((u) => !u.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">My Staff</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Staff</p>
            <p className="text-xl font-bold text-slate-800">{staff.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active</p>
            <p className="text-xl font-bold text-slate-800">{activeStaff.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <UserX size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Inactive</p>
            <p className="text-xl font-bold text-slate-800">{inactiveStaff.length}</p>
          </div>
        </Card>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-700">Add New Staff Member</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Full Name" placeholder="Enter name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" placeholder="staff@email.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Password" type="password" placeholder="Min 6 chars" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select label="Role" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
          <div className="mt-4 flex gap-3">
            <Button disabled={create.isPending || !form.name || !form.email || !form.password}
              onClick={() => create.mutate()}>
              <Plus size={14} /> Create Staff
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Staff List */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-slate-700">Staff Members</h2>
        {isLoading ? <p className="text-slate-400">Loading...</p> : staff.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No staff yet. Click Add Staff to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Joined</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-700">{u.name}</td>
                    <td className="py-3 text-slate-500">{u.email}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.role === 'SHOP_ADMIN' ? 'bg-sky-100 text-sky-700' :
                        u.role === 'BILLING_EXECUTIVE' ? 'bg-violet-100 text-violet-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{dateShort(u.createdAt)}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {u.role !== 'SHOP_ADMIN' && (
                          <>
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
                                  .then(() => toast.success('Password reset!'))
                                  .catch(() => toast.error('Failed'));
                              }}>
                              <Key size={12} /> Reset Password
                            </Button>
                          </>
                        )}
                      </div>
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
