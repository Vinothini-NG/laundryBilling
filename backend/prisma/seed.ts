import { PrismaClient, ServiceType, OrderStatus, InvoiceStatus, PaymentMode, DiscountType, GstMode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  try {
    // ── 1. Platform Admin ───────────────────────────────────────────
    const adminEmail = 'admin@laundryos.dev';
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Platform Admin',
          passwordHash: await bcrypt.hash('Admin@123', 10),
          role: 'PLATFORM_ADMIN',
          isActive: true,
        },
      });
      console.log('Created Platform Admin');
    }

    // ── 2. Sample Shop ──────────────────────────────────────────────
    let shop = await prisma.shop.findFirst({ where: { name: 'Sample Laundry' } });
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: 'Sample Laundry',
          email: 'sample@laundry.com',
          phone: '+91-9876500000',
          address: '123 Main Street, Chennai',
          gstNumber: '33AABCU9603R1ZM',
          status: 'ACTIVE',
          subscriptionPlan: 'PROFESSIONAL',
          gstMode: 'EXCLUSIVE',
          gstPercent: 18,
          invoicePrefix: 'INV',
          nextInvoiceSequence: 100,
        },
      });
      console.log('Created shop: ' + shop.name);
    }

    // ── 3. Shop Users ───────────────────────────────────────────────
    const users = [
      { email: 'owner@sample-laundry.com',   name: 'Rajesh Kumar',        role: 'SHOP_ADMIN' as const,         pw: 'Owner@123' },
      { email: 'billing@sample-laundry.com', name: 'Priya Sharma',        role: 'BILLING_EXECUTIVE' as const,  pw: 'Billing@123' },
      { email: 'staff@sample-laundry.com',   name: 'Arjun Singh',         role: 'LAUNDRY_STAFF' as const,      pw: 'Staff@123' },
      { email: 'staff2@sample-laundry.com',  name: 'Deepa Nair',          role: 'LAUNDRY_STAFF' as const,      pw: 'Staff@123' },
    ];

    const userMap: Record<string, string> = {};
    for (const u of users) {
      let existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        existing = await prisma.user.create({
          data: {
            email: u.email, name: u.name,
            passwordHash: await bcrypt.hash(u.pw, 10),
            role: u.role, isActive: true, shopId: shop.id,
          },
        });
        console.log('Created user: ' + u.name);
      }
      userMap[u.email] = existing.id;
    }

    // ── 4. Services ─────────────────────────────────────────────────
    const services: Array<{ itemName: string; serviceType: ServiceType; price: number }> = [
      { itemName: 'Shirt',       serviceType: 'WASH',         price: 50 },
      { itemName: 'T-Shirt',     serviceType: 'WASH',         price: 40 },
      { itemName: 'Trouser',     serviceType: 'WASH',         price: 60 },
      { itemName: 'Jeans',       serviceType: 'WASH',         price: 70 },
      { itemName: 'Saree',       serviceType: 'WASH_AND_IRON', price: 150 },
      { itemName: 'Kurta',       serviceType: 'WASH_AND_IRON', price: 80 },
      { itemName: 'Bed Sheet',   serviceType: 'WASH',         price: 80 },
      { itemName: 'Blanket',     serviceType: 'WASH',         price: 200 },
      { itemName: 'Curtains',    serviceType: 'WASH',         price: 120 },
      { itemName: 'Jacket',      serviceType: 'DRY_CLEAN',    price: 250 },
      { itemName: 'Suit',        serviceType: 'DRY_CLEAN',    price: 400 },
      { itemName: 'Tie',         serviceType: 'DRY_CLEAN',    price: 100 },
      { itemName: 'Shirt',       serviceType: 'IRON',         price: 20 },
      { itemName: 'Trouser',     serviceType: 'IRON',         price: 25 },
    ];

    const svcMap: Record<string, string> = {};
    for (const s of services) {
      let existing = await prisma.service.findFirst({
        where: { shopId: shop.id, itemName: s.itemName, serviceType: s.serviceType },
      });
      if (!existing) {
        existing = await prisma.service.create({
          data: { ...s, shopId: shop.id, isActive: true },
        });
      }
      svcMap[s.itemName + '_' + s.serviceType] = existing.id;
    }
    console.log('Created ' + services.length + ' services');

    // ── 5. Customers ────────────────────────────────────────────────
    const customers = [
      { name: 'Raj Kumar',       mobile: '9876543210', email: 'raj@email.com',      address: '12 Anna Nagar, Chennai' },
      { name: 'Priya Singh',     mobile: '9876543211', email: 'priya@email.com',    address: '45 T Nagar, Chennai' },
      { name: 'Amit Patel',      mobile: '9876543212', email: 'amit@email.com',     address: '78 Adyar, Chennai' },
      { name: 'Neha Sharma',     mobile: '9876543213', email: 'neha@email.com',     address: '23 Velachery, Chennai' },
      { name: 'Vikram Reddy',    mobile: '9876543214', email: 'vikram@email.com',   address: '56 Mylapore, Chennai' },
      { name: 'Anita Desai',     mobile: '9876543215', email: 'anita@email.com',    address: '89 Besant Nagar, Chennai' },
      { name: 'Suresh Menon',    mobile: '9876543216', email: 'suresh@email.com',   address: '34 Guindy, Chennai' },
      { name: 'Kavitha Rajan',   mobile: '9876543217', email: 'kavitha@email.com',  address: '67 Porur, Chennai' },
    ];

    const custMap: Record<string, string> = {};
    for (const c of customers) {
      let existing = await prisma.customer.findFirst({
        where: { shopId: shop.id, mobile: c.mobile },
      });
      if (!existing) {
        existing = await prisma.customer.create({
          data: { ...c, shopId: shop.id, loyaltyPoints: Math.floor(Math.random() * 100) },
        });
      }
      custMap[c.mobile] = existing.id;
    }
    console.log('Created ' + customers.length + ' customers');

    // ── 6. Sample Orders ────────────────────────────────────────────
    const existingOrders = await prisma.order.count({ where: { shopId: shop.id } });
    if (existingOrders > 0) {
      console.log('Orders already exist, skipping...');
      console.log('\nSeed complete!');
      console.log('\nLogins:');
      console.log('  Platform Admin:      admin@laundryos.dev / Admin@123');
      console.log('  Shop Owner:          owner@sample-laundry.com / Owner@123');
      console.log('  Billing Executive:   billing@sample-laundry.com / Billing@123');
      console.log('  Laundry Staff:       staff@sample-laundry.com / Staff@123');
      await prisma.$disconnect();
      return;
    }

    const orderDefs = [
      {
        customer: '9876543210', status: OrderStatus.DELIVERED,
        items: [{ name: 'Shirt', type: ServiceType.WASH, price: 50, qty: 3 }, { name: 'Trouser', type: ServiceType.WASH, price: 60, qty: 2 }],
        paid: true, assignedTo: 'staff@sample-laundry.com', daysAgo: 5,
      },
      {
        customer: '9876543211', status: OrderStatus.DELIVERED,
        items: [{ name: 'Saree', type: ServiceType.WASH_AND_IRON, price: 150, qty: 2 }, { name: 'Kurta', type: ServiceType.WASH_AND_IRON, price: 80, qty: 1 }],
        paid: true, assignedTo: 'staff@sample-laundry.com', daysAgo: 3,
      },
      {
        customer: '9876543212', status: OrderStatus.DELIVERED,
        items: [{ name: 'Suit', type: ServiceType.DRY_CLEAN, price: 400, qty: 1 }, { name: 'Tie', type: ServiceType.DRY_CLEAN, price: 100, qty: 2 }],
        paid: true, assignedTo: 'staff2@sample-laundry.com', daysAgo: 2,
      },
      {
        customer: '9876543213', status: OrderStatus.READY,
        items: [{ name: 'Shirt', type: ServiceType.WASH, price: 50, qty: 5 }, { name: 'Jeans', type: ServiceType.WASH, price: 70, qty: 2 }],
        paid: false, assignedTo: 'staff@sample-laundry.com', daysAgo: 1,
      },
      {
        customer: '9876543214', status: OrderStatus.READY,
        items: [{ name: 'Bed Sheet', type: ServiceType.WASH, price: 80, qty: 3 }, { name: 'Curtains', type: ServiceType.WASH, price: 120, qty: 2 }],
        paid: false, assignedTo: null, daysAgo: 1,
      },
      {
        customer: '9876543215', status: OrderStatus.IRONING,
        items: [{ name: 'Shirt', type: ServiceType.WASH, price: 50, qty: 4 }, { name: 'Trouser', type: ServiceType.WASH, price: 60, qty: 3 }],
        paid: false, assignedTo: 'staff2@sample-laundry.com', daysAgo: 1,
      },
      {
        customer: '9876543216', status: OrderStatus.WASHING,
        items: [{ name: 'Blanket', type: ServiceType.WASH, price: 200, qty: 2 }, { name: 'Bed Sheet', type: ServiceType.WASH, price: 80, qty: 2 }],
        paid: false, assignedTo: 'staff@sample-laundry.com', daysAgo: 0,
      },
      {
        customer: '9876543217', status: OrderStatus.CREATED,
        items: [{ name: 'Jacket', type: ServiceType.DRY_CLEAN, price: 250, qty: 1 }, { name: 'Shirt', type: ServiceType.WASH, price: 50, qty: 3 }],
        paid: false, assignedTo: null, daysAgo: 0,
      },
      {
        customer: '9876543210', status: OrderStatus.DRYING,
        items: [{ name: 'Kurta', type: ServiceType.WASH_AND_IRON, price: 80, qty: 2 }],
        paid: false, assignedTo: 'staff@sample-laundry.com', daysAgo: 0,
      },
      {
        customer: '9876543211', status: OrderStatus.QUALITY_CHECK,
        items: [{ name: 'Saree', type: ServiceType.WASH_AND_IRON, price: 150, qty: 1 }, { name: 'Shirt', type: ServiceType.IRON, price: 20, qty: 5 }],
        paid: false, assignedTo: 'staff2@sample-laundry.com', daysAgo: 0,
      },
      {
        customer: '9876543212', status: OrderStatus.RECEIVED,
        items: [{ name: 'Suit', type: ServiceType.DRY_CLEAN, price: 400, qty: 2 }],
        paid: false, assignedTo: null, daysAgo: 0,
      },
      {
        customer: '9876543213', status: OrderStatus.DELIVERED,
        items: [{ name: 'Shirt', type: ServiceType.WASH, price: 50, qty: 2 }, { name: 'Trouser', type: ServiceType.IRON, price: 25, qty: 2 }],
        paid: true, assignedTo: 'staff@sample-laundry.com', daysAgo: 0,
      },
    ];

    const gstPercent = 18;
    const billingUserId = userMap['billing@sample-laundry.com'];

    for (let i = 0; i < orderDefs.length; i++) {
      const def = orderDefs[i];
      const seq = i + 1;
      const orderNumber = 'ORD-' + String(seq).padStart(5, '0');
      const invoiceNumber = 'INV-' + String(seq).padStart(5, '0');

      const subtotal = def.items.reduce((s, it) => s + it.price * it.qty, 0);
      const taxAmount = Math.round(subtotal * gstPercent / 100 * 100) / 100;
      const grandTotal = subtotal + taxAmount;

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - def.daysAgo);
      createdAt.setHours(9 + i, 30, 0, 0);

      const assignedToId = def.assignedTo ? (userMap[def.assignedTo] || null) : null;

      const order = await prisma.order.create({
        data: {
          shopId: shop.id,
          customerId: custMap[def.customer],
          createdById: billingUserId,
          assignedToId,
          orderNumber,
          status: def.status,
          subtotal,
          discountType: 'NONE',
          discountValue: 0,
          discountAmount: 0,
          taxableAmount: subtotal,
          gstMode: 'EXCLUSIVE',
          gstPercent,
          taxAmount,
          grandTotal,
          createdAt,
          deliveredAt: def.status === OrderStatus.DELIVERED ? createdAt : null,
          items: {
            create: def.items.map((it) => ({
              itemName: it.name,
              serviceType: it.type,
              unitPrice: it.price,
              quantity: it.qty,
              lineTotal: it.price * it.qty,
              serviceId: svcMap[it.name + '_' + it.type] || null,
            })),
          },
          invoice: {
            create: {
              shopId: shop.id,
              invoiceNumber,
              grandTotal,
              amountPaid: def.paid ? grandTotal : 0,
              balance: def.paid ? 0 : grandTotal,
              status: def.paid ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
            },
          },
        },
      });

      // Create payment if paid
      if (def.paid) {
        const invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
        if (invoice) {
          await prisma.payment.create({
            data: {
              shopId: shop.id,
              invoiceId: invoice.id,
              amount: grandTotal,
              mode: PaymentMode.CASH,
              createdAt,
            },
          });
        }
      }

      console.log('Created order ' + orderNumber + ' [' + def.status + ']');
    }

    // Update shop sequence
    await prisma.shop.update({
      where: { id: shop.id },
      data: { nextInvoiceSequence: orderDefs.length + 1 },
    });

    console.log('\nSeed complete!');
    console.log('\nLogins:');
    console.log('  Platform Admin:      admin@laundryos.dev / Admin@123');
    console.log('  Shop Owner:          owner@sample-laundry.com / Owner@123');
    console.log('  Billing Executive:   billing@sample-laundry.com / Billing@123');
    console.log('  Laundry Staff:       staff@sample-laundry.com / Staff@123');
    console.log('  Laundry Staff 2:     staff2@sample-laundry.com / Staff@123');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
