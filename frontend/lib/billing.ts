import type { DiscountType, GstMode } from './types';

// Mirror of backend/src/orders/billing.ts so the counter sees a live total
// before saving. Keep the two in sync.

export interface BillingLine {
  unitPrice: number;
  quantity: number;
}

export interface BillingInput {
  lines: BillingLine[];
  discountType: DiscountType;
  discountValue: number;
  expressCharge?: number;
  pickupCharge?: number;
  deliveryCharge?: number;
  specialHandling?: number;
  gstMode: GstMode;
  gstPercent: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeBill(input: BillingInput) {
  const subtotal = round2(
    input.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
  );

  let discountAmount = 0;
  if (input.discountType === 'PERCENTAGE')
    discountAmount = (subtotal * input.discountValue) / 100;
  else if (input.discountType === 'FIXED') discountAmount = input.discountValue;
  discountAmount = round2(Math.min(Math.max(discountAmount, 0), subtotal));

  const charges = round2(
    (input.expressCharge ?? 0) +
      (input.pickupCharge ?? 0) +
      (input.deliveryCharge ?? 0) +
      (input.specialHandling ?? 0),
  );

  const netBeforeTax = round2(subtotal - discountAmount + charges);

  let taxableAmount = netBeforeTax;
  let taxAmount = 0;
  let grandTotal = netBeforeTax;

  if (input.gstMode === 'EXCLUSIVE' && input.gstPercent > 0) {
    taxAmount = round2((netBeforeTax * input.gstPercent) / 100);
    grandTotal = round2(netBeforeTax + taxAmount);
  } else if (input.gstMode === 'INCLUSIVE' && input.gstPercent > 0) {
    taxableAmount = round2((netBeforeTax * 100) / (100 + input.gstPercent));
    taxAmount = round2(netBeforeTax - taxableAmount);
  }

  return { subtotal, discountAmount, charges, taxableAmount, taxAmount, grandTotal };
}
