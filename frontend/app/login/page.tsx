'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shirt } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useAuth } from '@/lib/store';
import type { AuthUser } from '@/lib/types';
import { Button, Card, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    shopName: '',
    ownerName: '',
    phone: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register-shop';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : {
              shopName: form.shopName,
              ownerName: form.ownerName,
              email: form.email,
              password: form.password,
              phone: form.phone || undefined,
            };
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
        url,
        payload,
      );
      login(data.accessToken, data.user);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Shop created!');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(apiError(err, 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white">
            <Shirt size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">LaundryOS</h1>
            <p className="text-xs text-slate-500">
              Laundry Billing & Management
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <>
              <Input
                label="Shop name"
                value={form.shopName}
                onChange={set('shopName')}
                required
                placeholder="Sparkle Laundry"
              />
              <Input
                label="Your name"
                value={form.ownerName}
                onChange={set('ownerName')}
                required
                placeholder="Owner name"
              />
              <Input
                label="Phone (optional)"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91…"
              />
            </>
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            placeholder="you@shop.com"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            placeholder="••••••••"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create shop'}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 w-full text-center text-sm text-sky-600 hover:underline"
        >
          {mode === 'login'
            ? 'New here? Register your laundry shop'
            : 'Already have an account? Sign in'}
        </button>

        {mode === 'login' && (
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-600">Demo logins</p>
            <p>Shop admin · owner@sparkle.dev / Owner@123</p>
            <p>Platform admin · admin@laundryos.dev / Admin@123</p>
          </div>
        )}
      </Card>
    </div>
  );
}
