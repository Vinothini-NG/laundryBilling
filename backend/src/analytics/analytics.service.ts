import { Injectable } from '@nestjs/common';
import { InvoiceStatus, OrderStatus, ShopStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Shop Admin / Billing dashboard. */
  async shopDashboard(user: AuthUser, shopId?: string) {
    const sid = resolveShopId(user, shopId);
    const today = startOfToday();
    const monthStart = daysAgo(30);

    const [
      ordersToday,
      ordersPending,
      ordersDelivered,
      collectedToday,
      collectedMonth,
      outstanding,
      newCustomers,
      topServices,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { shopId: sid, createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: {
          shopId: sid,
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
        },
      }),
      this.prisma.order.count({
        where: { shopId: sid, status: OrderStatus.DELIVERED },
      }),
      this.prisma.payment.aggregate({
        where: { shopId: sid, createdAt: { gte: today }, isRefund: false },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { shopId: sid, createdAt: { gte: monthStart }, isRefund: false },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          shopId: sid,
          status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID] },
        },
        _sum: { balance: true },
      }),
      this.prisma.customer.count({
        where: { shopId: sid, createdAt: { gte: monthStart } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['itemName'],
        where: { order: { shopId: sid } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      orders: {
        today: ordersToday,
        pending: ordersPending,
        delivered: ordersDelivered,
      },
      revenue: {
        collectedToday: collectedToday._sum.amount ?? 0,
        collectedLast30Days: collectedMonth._sum.amount ?? 0,
        outstanding: outstanding._sum.balance ?? 0,
      },
      customers: { newLast30Days: newCustomers },
      topServices: topServices.map((s) => ({
        itemName: s.itemName,
        quantity: s._sum.quantity ?? 0,
        revenue: s._sum.lineTotal ?? 0,
      })),
    };
  }

  /** Platform Admin global dashboard. */
  async platformDashboard() {
    const [shops, activeShops, trialShops, totalOrders, totalCustomers, revenue] =
      await Promise.all([
        this.prisma.shop.count(),
        this.prisma.shop.count({ where: { status: ShopStatus.ACTIVE } }),
        this.prisma.shop.count({ where: { status: ShopStatus.TRIAL } }),
        this.prisma.order.count(),
        this.prisma.customer.count(),
        this.prisma.payment.aggregate({
          where: { isRefund: false },
          _sum: { amount: true },
        }),
      ]);

    // Revenue leaderboard: top shops by collected payments.
    const byShop = await this.prisma.payment.groupBy({
      by: ['shopId'],
      where: { isRefund: false },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });
    const shopNames = await this.prisma.shop.findMany({
      where: { id: { in: byShop.map((b) => b.shopId) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(shopNames.map((s) => [s.id, s.name]));

    return {
      shops: {
        total: shops,
        active: activeShops,
        trial: trialShops,
        inactive: shops - activeShops - trialShops,
      },
      totals: {
        orders: totalOrders,
        customers: totalCustomers,
        collected: revenue._sum.amount ?? 0,
      },
      leaderboard: byShop.map((b) => ({
        shopId: b.shopId,
        shopName: nameMap.get(b.shopId) ?? 'Unknown',
        revenue: b._sum.amount ?? 0,
      })),
    };
  }
}
