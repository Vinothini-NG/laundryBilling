'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';

interface Props {
  order: Order;
  onClose: () => void;
}

export default function PrintBill({ order, onClose }: Props) {
  // Fetch full order with items + shop
  const { data: o, isLoading } = useQuery<any>({
    queryKey: ['order-detail', order.id],
    queryFn: async () => (await api.get('/orders/' + order.id)).data,
  });

  if (isLoading || !o) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="rounded-xl bg-white p-8 text-slate-500">Loading bill...</div>
      </div>
    );
  }

  const shop = o.shop;
  const totalItems = o.items ? o.items.reduce((s: number, it: any) => s + it.quantity, 0) : 0;
  const amountPaid = o.invoice ? o.invoice.grandTotal - o.invoice.balance : 0;
  const balance = o.invoice?.balance ?? o.grandTotal;
  const billDate = new Date(o.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
  const billNo = 'LB' + new Date(o.createdAt).getFullYear() + o.orderNumber.replace('ORD-', '');

  function handlePrint() {
    const el = document.getElementById('bill-preview');
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<html><head><title>' + billNo + '</title>');
    w.document.write('<style>');
    w.document.write('*{margin:0;padding:0;box-sizing:border-box}');
    w.document.write("body{font-family:'Courier New',Courier,monospace;width:400px;margin:0 auto;padding:20px;font-size:14px;line-height:1.5;color:#000}");
    w.document.write('.bold{font-weight:bold}');
    w.document.write('pre{font-family:inherit;font-size:inherit;white-space:pre;margin:0}');
    w.document.write('@media print{body{width:100%;padding:10px}@page{size:80mm auto;margin:5mm}}');
    w.document.write('</style></head><body>');
    w.document.write('<pre>' + el.innerText + '</pre>');
    w.document.write('<script>window.onload=function(){window.print()}<\/script>');
    w.document.write('</body></html>');
    w.document.close();
  }

  const W = 42;
  const EQ = '='.repeat(W);
  const DA = '-'.repeat(W);

  function center(text: string) {
    const spaces = Math.max(0, Math.floor((W - text.length) / 2));
    return ' '.repeat(spaces) + text;
  }

  function row(left: string, right: string) {
    const gap = W - left.length - right.length;
    return left + ' '.repeat(Math.max(gap, 1)) + right;
  }

  const shopName = (shop?.name || 'LAUNDRY SERVICES').toUpperCase();
  const shopAddr = shop?.address || '';
  const shopGst = shop?.gstNumber ? 'GSTIN: ' + shop.gstNumber : '';
  const shopPh = shop?.phone || '';

  let b = '';
  b += center(shopName) + '\n';
  if (shopAddr) b += center(shopAddr) + '\n';
  if (shopGst) b += center(shopGst) + '\n';
  if (shopPh) b += center('Ph: ' + shopPh) + '\n';
  b += EQ + '\n';
  b += center('LAUNDRY BILL') + '\n';
  b += EQ + '\n';
  b += '\n';
  b += row('Bill No : ' + billNo, billDate) + '\n';
  b += 'Customer: ' + (o.customer?.name || 'Walk-in') + '\n';
  if (o.customer?.mobile) b += 'Phone : +91-' + o.customer.mobile + '\n';
  b += DA + '\n';
  b += row('Item', 'Qty x Rate      Amount') + '\n';
  b += DA + '\n';

  // Items
  if (o.items && o.items.length > 0) {
    for (const it of o.items) {
      const svcType = it.serviceType.replace(/_/g, ' ');
      const name = it.itemName + ' ' + svcType;
      const col1 = name.length > 18 ? name.substring(0, 18) : name.padEnd(18);
      const col2 = (it.quantity + ' x ' + it.unitPrice).padStart(10);
      const col3 = String(it.lineTotal).padStart(10);
      b += col1 + col2 + '  ' + col3 + '\n';
    }
  }

  b += DA + '\n';
  b += row('Total Items : ' + totalItems, 'TOTAL Rs.  ' + o.grandTotal) + '\n';
  b += DA + '\n';

  if (o.discountAmount > 0) {
    b += row('Discount', 'Rs.  ' + o.discountAmount) + '\n';
  }
  if (o.taxAmount > 0) {
    b += row('GST (' + o.gstPercent + '%)', 'Rs.  ' + o.taxAmount) + '\n';
  }
  if (amountPaid > 0) {
    b += row('Advance Paid', 'Rs.  ' + amountPaid) + '\n';
  }
  b += DA + '\n';
  b += row('Balance Due', 'Rs.  ' + balance) + '\n';
  b += DA + '\n';
  b += '\n';
  b += center('Thank you for your business!') + '\n';
  b += center('** Computer Generated Bill **') + '\n';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-[420px] rounded-xl bg-white shadow-2xl">
        <div className="max-h-[75vh] overflow-y-auto bg-white p-6">
          <pre id="bill-preview"
            className="mx-auto font-mono text-[13px] leading-snug whitespace-pre text-black"
            style={{ maxWidth: 400, fontFamily: "'Courier New', Courier, monospace" }}>
{b}
          </pre>
        </div>
        <div className="flex gap-3 border-t border-slate-200 p-4 bg-slate-50">
          <button onClick={handlePrint}
            className="flex-1 rounded-lg bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-700">
            Print Bill
          </button>
          <button onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
