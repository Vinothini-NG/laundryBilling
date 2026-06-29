'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Shield, Smartphone } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';

export default function SettingsPage() {
  const [biz, setBiz] = useState({ name: 'LaundryOS', phone: '', address: '', gst: '' });
  const [sec, setSec] = useState({ current: '', next: '', confirm: '' });

  function handleSave() { toast.success('Settings saved'); }

  function handlePwd() {
    if (sec.next !== sec.confirm) { toast.error('Passwords do not match'); return; }
    if (sec.next.length < 6) { toast.error('Min 6 characters'); return; }
    toast.success('Password changed');
    setSec({ current: '', next: '', confirm: '' });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-700">
          <Building2 size={18} className="text-sky-600" /> Business Settings
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Business Name" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
          <Input label="Contact Number" value={biz.phone} onChange={(e) => setBiz({ ...biz, phone: e.target.value })} />
          <Input label="Address" value={biz.address} onChange={(e) => setBiz({ ...biz, address: e.target.value })} />
          <Input label="GST Number" value={biz.gst} onChange={(e) => setBiz({ ...biz, gst: e.target.value })} />
        </div>
        <Button className="mt-4" onClick={handleSave}>Save Changes</Button>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-700">
          <Smartphone size={18} className="text-violet-600" /> App Settings
        </h2>
        <div className="space-y-3">
          {[
            { id: 'dark',   label: 'Dark Mode',           desc: 'Enable dark theme' },
            { id: 'email',  label: 'Email Notifications', desc: 'Get order updates by email' },
            { id: 'backup', label: 'Auto Backup',         desc: 'Daily automatic backup' },
          ].map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
              <div>
                <p className="font-medium text-slate-700">{s.label}</p>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
              <input type="checkbox" className="h-5 w-5 cursor-pointer rounded accent-sky-600" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-700">
          <Shield size={18} className="text-rose-600" /> Security
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Current Password" type="password" value={sec.current} onChange={(e) => setSec({ ...sec, current: e.target.value })} />
          <Input label="New Password" type="password" value={sec.next} onChange={(e) => setSec({ ...sec, next: e.target.value })} />
          <Input label="Confirm Password" type="password" value={sec.confirm} onChange={(e) => setSec({ ...sec, confirm: e.target.value })} />
        </div>
        <Button variant="danger" className="mt-4" onClick={handlePwd}>Change Password</Button>
      </Card>
    </div>
  );
}
