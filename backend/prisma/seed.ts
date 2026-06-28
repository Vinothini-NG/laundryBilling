import { PrismaClient, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  try {
    const adminEmail = 'admin@laundryos.dev';
    const adminPassword = 'Admin@123';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Platform Admin',
          passwordHash: hashedPassword,
          role: 'PLATFORM_ADMIN',
          isActive: true,
          shopId: null,
        },
      });
      console.log('✓ Created Platform Admin user');
    }

    let sampleShop = await prisma.shop.findFirst({
      where: { name: 'Sample Laundry' },
    });

    if (!sampleShop) {
      sampleShop = await prisma.shop.create({
        data: {
          name: 'Sample Laundry',
          email: 'sample@laundry.com',
          phone: '+91-1234567890',
          address: '123 Main Street, City',
          gstNumber: 'GST123456789',
          status: 'ACTIVE',
          subscriptionPlan: 'PROFESSIONAL',
          gstMode: 'EXCLUSIVE',
          gstPercent: 18,
        },
      });
      console.log('✓ Created sample shop');
    }

    const services: Array<{
      itemName: string;
      serviceType: ServiceType;
      price: number;
    }> = [
      { itemName: 'Shirt', serviceType: 'WASH', price: 50 },
      { itemName: 'T-Shirt', serviceType: 'WASH', price: 40 },
      { itemName: 'Trouser', serviceType: 'WASH', price: 60 },
      { itemName: 'Saree', serviceType: 'WASH_AND_IRON', price: 150 },
      { itemName: 'Bed Sheet', serviceType: 'WASH', price: 80 },
      { itemName: 'Jacket', serviceType: 'DRY_CLEAN', price: 200 },
      { itemName: 'Suit', serviceType: 'DRY_CLEAN', price: 400 },
      { itemName: 'Tie', serviceType: 'DRY_CLEAN', price: 100 },
    ];

    for (const service of services) {
      const existing = await prisma.service.findFirst({
        where: {
          shopId: sampleShop.id,
          itemName: service.itemName,
          serviceType: service.serviceType,
        },
      });
      if (!existing) {
        await prisma.service.create({
          data: { ...service, shopId: sampleShop.id, isActive: true },
        });
      }
    }
    console.log('✓ Created services');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Admin: admin@laundryos.dev / Admin@123');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
