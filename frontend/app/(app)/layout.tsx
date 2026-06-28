'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ShoppingBag,
  Tags,
  Building2,
  LogOut,
  Shirt,
} from 'lucide-react';
import { useAuth } from '@/lib/store';
import type { Role } from '@/lib/types';

const NAV: { href: string; label: string; icon: typeof Users; roles?: Role[] }[] =
  [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      href: '/orders/new',
      label: 'New Order',
      icon: ShoppingBag,
      roles: ['SHOP_ADMIN', 'BILLING_EXECUTIVE'],
    },
    { href: '/orders', label: 'Orders', icon: Receipt },
    {
      href: '/customers',
      label: 'Customers',
      icon: Users,
      roles: ['SHOP_ADMIN', 'BILLING_EXECUTIVE'],
    },
    {
      href: '/services',
      label: 'Services & Pricing',
      icon: Tags,
      roles: ['SHOP_ADMIN'],
    },
    {
      href: '/shops',
      label: 'Shops',
      icon: Building2,
      roles: ['PLATFORM_ADMIN'],
    },
  ];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <aside className="no-print flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white">
            <Shirt size={18} />
          </div>
          <span className="font-bold text-slate-800">LaundryOS</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((n) => {
            const active =
              pathname === n.href ||
              (n.href !== '/dashboard' && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <n.icon size={18} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="px-3 py-2 text-xs text-slate-500">
            <p className="truncate font-medium text-slate-700">{user.email}</p>
            <p>{user.role.replace(/_/g, ' ')}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
