import {
  PrismaClient,
  Role,
  ServiceType,
  ShopStatus,
  GstMode,
  SubscriptionPlan,
  DiscountType,
  InvoiceStatus,
  PaymentMode,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { computeBill } from '../src/orders/billing';

const prisma = new PrismaClient();

async function main() {
  const adminEmail =
    process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@laundryos.dev';
  const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'Admin@123';

  // ── Platform super admin ────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Platform Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: Role.PLATFORM_ADMIN,
      shopId: null,
    },
  });

  // ── Demo shop ───────────────────────────────────────────────────────
  const shopEmail = 'demo@laundryos.dev';
  let shop = await prisma.shop.findFirst({ where: { email: shopEmail } });
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: 'Sparkle Laundry',
        email: shopEmail,
        phone: '+91 90000 00000',
        address: '12 MG Road, Bengaluru',
        gstNumber: '29ABCDE1234F1Z5',
        status: ShopStatus.ACTIVE,
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        gstMode: GstMode.EXCLUSIVE,
        gstPercent: 18,
        invoicePrefix: 'INV',
      },
    });
  }

  // Shop admin + staff
  const shopAdmin = await prisma.user.upsert({
    where: { email: 'owner@sparkle.dev' },
    update: {},
    create: {
      name: 'Sparkle Owner',
      email: 'owner@sparkle.dev',
      passwordHash: await bcrypt.hash('Owner@123', 10),
      role: Role.SHOP_ADMIN,
      shopId: shop.id,
    },
  });
  await prisma.user.upsert({
    where: { email: 'counter@sparkle.dev' },
    update: {},
    create: {
      name: 'Counter Staff',
      email: 'counter@sparkle.dev',
      passwordHash: await bcrypt.hash('Counter@123', 10),
      role: Role.BILLING_EXECUTIVE,
      shopId: shop.id,
    },
  });

  // ── Service catalogue ───────────────────────────────────────────────
  const catalogue: Array<[string, ServiceType, number]> = [
    ['Shirt', ServiceType.WASH, 20],
    ['Pant', ServiceType.WASH, 25],
    ['Saree', ServiceType.WASH, 80],
    ['Bedsheet', ServiceType.WASH, 60],
    ['Blanket', ServiceType.WASH, 120],
    ['Shirt', ServiceType.IRON, 10],
    ['Pant', ServiceType.IRON, 12],
    ['Suit', ServiceType.DRY_CLEAN, 250],
    ['Blazer', ServiceType.DRY_CLEAN, 220],
    ['Shirt', ServiceType.WASH_AND_IRON, 28],
  ];
  for (const [itemName, serviceType, price] of catalogue) {
    await prisma.service.upsert({
      where: {
        shopId_itemName_serviceType: {
          shopId: shop.id,
          itemName,
          serviceType,
        },
      },
      update: { price },
      create: { shopId: shop.id, itemName, serviceType, price },
    });
  }

  // ── Demo customer ───────────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { shopId_mobile: { shopId: shop.id, mobile: '9876543210' } },
    update: {},
    create: {
      shopId: shop.id,
      name: 'Ramesh Kumar',
      mobile: '9876543210',
      email: 'ramesh@example.com',
      address: '4th Cross, Indiranagar',
    },
  });

  // ── Sample order + invoice + partial payment ────────────────────────
  const existingOrder = await prisma.order.findFirst({
    where: { shopId: shop.id },
  });
  if (!existingOrder) {
    const items = [
      { itemName: 'Shirt', serviceType: ServiceType.WASH, unitPrice: 20, quantity: 5 },
      { itemName: 'Pant', serviceType: ServiceType.WASH, unitPrice: 25, quantity: 2 },
      { itemName: 'Saree', serviceType: ServiceType.WASH, unitPrice: 80, quantity: 1 },
    ];
    const bill = computeBill({
      lines: items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      deliveryCharge: 20,
      gstMode: shop.gstMode,
      gstPercent: shop.gstPercent,
    });

    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: { nextInvoiceSequence: { increment: 1 } },
    });
    const seq = String(updatedShop.nextInvoiceSequence - 1).padStart(5, '0');

    const order = await prisma.order.create({
      data: {
        shopId: shop.id,
        customerId: customer.id,
        createdById: shopAdmin.id,
        orderNumber: `ORD-${seq}`,
        subtotal: bill.subtotal,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        discountAmount: bill.discountAmount,
        deliveryCharge: 20,
        taxableAmount: bill.taxableAmount,
        gstMode: shop.gstMode,
        gstPercent: shop.gstPercent,
        taxAmount: bill.taxAmount,
        grandTotal: bill.grandTotal,
        items: {
          create: items.map((i) => ({
            ...i,
            lineTotal: i.unitPrice * i.quantity,
          })),
        },
        invoice: {
          create: {
            shopId: shop.id,
            invoiceNumber: `INV-${seq}`,
            grandTotal: bill.grandTotal,
            amountPaid: 100,
            balance: Math.round((bill.grandTotal - 100) * 100) / 100,
            status: InvoiceStatus.PARTIALLY_PAID,
            payments: {
              create: {
                shopId: shop.id,
                amount: 100,
                mode: PaymentMode.UPI,
                reference: 'UPI-DEMO-001',
              },
            },
          },
        },
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded sample order ${order.orderNumber} (₹${bill.grandTotal})`);
  }

  // eslint-disable-next-line no-console
  console.log('\nSeed complete. Logins:');
  console.log(`  Platform admin : ${adminEmail} / ${adminPassword}`);
  console.log('  Shop admin     : owner@sparkle.dev / Owner@123');
  console.log('  Billing staff  : counter@sparkle.dev / Counter@123');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
