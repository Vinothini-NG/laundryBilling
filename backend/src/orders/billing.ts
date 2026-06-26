import { DiscountType, GstMode } from '@prisma/client';

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

export interface BillingResult {
  subtotal: number;
  discountAmount: number;
  charges: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Single source of truth for invoice math. Pure and deterministic so it can be
 * unit-tested and reused verbatim by the frontend preview.
 *
 * Order of operations:
 *   1. subtotal      = Σ(unitPrice × qty)
 *   2. discount       applied to subtotal (fixed amount or percentage)
 *   3. extra charges  added after discount (express/pickup/delivery/handling)
 *   4. tax            EXCLUSIVE → added on top;  INCLUSIVE → carved out of total
 */
export function computeBill(input: BillingInput): BillingResult {
  const subtotal = round2(
    input.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );

  let discountAmount = 0;
  if (input.discountType === DiscountType.PERCENTAGE) {
    discountAmount = (subtotal * input.discountValue) / 100;
  } else if (input.discountType === DiscountType.FIXED) {
    discountAmount = input.discountValue;
  }
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

  if (input.gstMode === GstMode.EXCLUSIVE && input.gstPercent > 0) {
    taxAmount = round2((netBeforeTax * input.gstPercent) / 100);
    grandTotal = round2(netBeforeTax + taxAmount);
    taxableAmount = netBeforeTax;
  } else if (input.gstMode === GstMode.INCLUSIVE && input.gstPercent > 0) {
    // Tax is baked into netBeforeTax; back it out for reporting.
    taxableAmount = round2((netBeforeTax * 100) / (100 + input.gstPercent));
    taxAmount = round2(netBeforeTax - taxableAmount);
    grandTotal = netBeforeTax;
  }

  return {
    subtotal,
    discountAmount,
    charges,
    taxableAmount,
    taxAmount,
    grandTotal,
  };
}
