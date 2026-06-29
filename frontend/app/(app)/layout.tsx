'use client';

import { useEffect, useState } from 'react';
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
  Menu,
  X,
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
    { href: '/orders', label: 'Orders', icon: Receipt, roles: ['SHOP_ADMIN', 'BILLING_EXECUTIVE', 'LAUNDRY_STAFF'] },
    {
      href: '/my-orders',
      label: 'My Orders',
      icon: ClipboardList,
      roles: ['LAUNDRY_STAFF'],
    },
    {
      href: '/ready-orders',
      label: 'Ready',
      icon: PackageCheck,
      roles: ['LAUNDRY_STAFF'],
    },
    {
      href: '/delivered-orders',
      label: 'Delivered',
      icon: Truck,
      roles: ['LAUNDRY_STAFF'],
    },
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
      href: '/shop-staff',
      label: 'My Staff',
      icon: UserCog,
      roles: ['SHOP_ADMIN'],
    },
    {
      href: '/deliveries',
      label: 'Deliveries',
      icon: Truck,
      roles: ['SHOP_ADMIN', 'BILLING_EXECUTIVE'],
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white">
              <Shirt size={18} />
            </div>
            <span className="font-bold text-slate-800">LaundryOS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((n) => {
            const active =
              pathname === n.href ||
              (n.href !== '/dashboard' && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setSidebarOpen(false)}
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

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white">
              <Shirt size={16} />
            </div>
            <span className="font-bold text-slate-800">LaundryOS</span>
          </div>
          <button onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-3 pr-1 hover:bg-slate-50">
            <span className="text-xs font-medium text-slate-600">{user.email.split('@')[0]}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-sm font-bold">
              {user.email[0].toUpperCase()}
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
