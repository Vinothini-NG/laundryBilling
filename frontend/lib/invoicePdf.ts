import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Order } from './types';
import { inr, SERVICE_LABEL, dateShort } from './format';

/**
 * Generates an A4 PDF invoice entirely client-side (no paid PDF service).
 * Includes a QR code that encodes the invoice number + total for quick lookup.
 */
export async function downloadInvoicePdf(order: Order) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = 50;

  const shop = order.shop;
  const inv = order.invoice;

  // Header
  doc.setFontSize(20).setFont('helvetica', 'bold');
  doc.text(shop?.name ?? 'Laundry', M, y);
  doc.setFontSize(9).setFont('helvetica', 'normal');
  y += 16;
  if (shop?.address) doc.text(shop.address, M, y), (y += 12);
  if (shop?.phone) doc.text(`Phone: ${shop.phone}`, M, y), (y += 12);
  if (shop?.gstNumber) doc.text(`GSTIN: ${shop.gstNumber}`, M, y), (y += 12);

  // Invoice meta (right aligned)
  doc.setFontSize(16).setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', W - M, 50, { align: 'right' });
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text(`Invoice: ${inv?.invoiceNumber ?? '-'}`, W - M, 70, {
    align: 'right',
  });
  doc.text(`Order: ${order.orderNumber}`, W - M, 84, { align: 'right' });
  doc.text(`Date: ${dateShort(order.createdAt)}`, W - M, 98, {
    align: 'right',
  });

  y = Math.max(y, 110) + 14;
  doc.setDrawColor(220).line(M, y, W - M, y);
  y += 20;

  // Bill to
  doc.setFont('helvetica', 'bold').text('Bill To', M, y);
  doc.setFont('helvetica', 'normal');
  y += 14;
  doc.text(order.customer?.name ?? '-', M, y);
  y += 12;
  if (order.customer?.mobile) doc.text(order.customer.mobile, M, y), (y += 12);

  y += 10;

  // Items table header
  const cols = { item: M, svc: 250, price: 360, qty: 440, total: W - M };
  doc.setFont('helvetica', 'bold');
  doc.text('Item', cols.item, y);
  doc.text('Service', cols.svc, y);
  doc.text('Price', cols.price, y, { align: 'right' });
  doc.text('Qty', cols.qty, y, { align: 'right' });
  doc.text('Amount', cols.total, y, { align: 'right' });
  y += 8;
  doc.setDrawColor(220).line(M, y, W - M, y);
  y += 16;
  doc.setFont('helvetica', 'normal');

  for (const it of order.items ?? []) {
    doc.text(it.itemName, cols.item, y);
    doc.text(SERVICE_LABEL[it.serviceType] ?? it.serviceType, cols.svc, y);
    doc.text(inr(it.unitPrice), cols.price, y, { align: 'right' });
    doc.text(String(it.quantity), cols.qty, y, { align: 'right' });
    doc.text(inr(it.lineTotal), cols.total, y, { align: 'right' });
    y += 16;
  }

  y += 6;
  doc.setDrawColor(220).line(300, y, W - M, y);
  y += 18;

  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, 360, y);
    doc.text(value, W - M, y, { align: 'right' });
    y += 16;
  };
  totalRow('Subtotal', inr(order.subtotal));
  if (order.discountAmount > 0) totalRow('Discount', `- ${inr(order.discountAmount)}`);
  if (order.taxAmount > 0)
    totalRow(`GST (${order.gstPercent}%)`, inr(order.taxAmount));
  totalRow('Grand Total', inr(order.grandTotal), true);
  if (inv) {
    totalRow('Paid', inr(inv.amountPaid));
    totalRow('Balance', inr(inv.balance), true);
  }

  // QR code
  const qrPayload = JSON.stringify({
    invoice: inv?.invoiceNumber,
    order: order.orderNumber,
    total: order.grandTotal,
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 120 });
  doc.addImage(qrDataUrl, 'PNG', M, y - 70, 80, 80);
  doc.setFontSize(8).setTextColor(120);
  doc.text('Scan to verify', M, y + 18);

  doc.setTextColor(150);
  doc.text('Thank you for your business!', W / 2, y + 40, { align: 'center' });

  doc.save(`${inv?.invoiceNumber ?? order.orderNumber}.pdf`);
}
