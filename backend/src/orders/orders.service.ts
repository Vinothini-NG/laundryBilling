import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DiscountType,
  GstMode,
  InvoiceStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';
import { computeBill } from './billing';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateOrderDto) {
    const shopId = resolveShopId(user, dto.shopId);

    const [shop, customer] = await Promise.all([
      this.prisma.shop.findUnique({ where: { id: shopId } }),
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
    ]);
    if (!shop) throw new NotFoundException('Shop not found');
    if (!customer || customer.shopId !== shopId) {
      throw new BadRequestException('Customer does not belong to this shop');
    }

    // Tax: per-order override falls back to the shop defaults.
    const gstMode = dto.gstMode ?? shop.gstMode;
    const gstPercent = dto.gstPercent ?? shop.gstPercent;

    const bill = computeBill({
      lines: dto.items.map((i) => ({
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      discountType: dto.discountType ?? DiscountType.NONE,
      discountValue: dto.discountValue ?? 0,
      expressCharge: dto.expressCharge,
      pickupCharge: dto.pickupCharge,
      deliveryCharge: dto.deliveryCharge,
      specialHandling: dto.specialHandling,
      gstMode,
      gstPercent,
    });

    // Everything below is one transaction so the per-shop sequence counter,
    // the order, its line items and the invoice are created atomically.
    return this.prisma.$transaction(async (tx) => {
      const updatedShop = await tx.shop.update({
        where: { id: shopId },
        data: { nextInvoiceSequence: { increment: 1 } },
      });
      const seq = updatedShop.nextInvoiceSequence - 1;
      const padded = String(seq).padStart(5, '0');
      const orderNumber = `ORD-${padded}`;
      const invoiceNumber = `${shop.invoicePrefix}-${padded}`;

      const order = await tx.order.create({
        data: {
          shopId,
          customerId: customer.id,
          createdById: user.userId,
          orderNumber,
          status: OrderStatus.CREATED,
          subtotal: bill.subtotal,
          discountType: dto.discountType ?? DiscountType.NONE,
          discountValue: dto.discountValue ?? 0,
          discountAmount: bill.discountAmount,
          expressCharge: dto.expressCharge ?? 0,
          pickupCharge: dto.pickupCharge ?? 0,
          deliveryCharge: dto.deliveryCharge ?? 0,
          specialHandling: dto.specialHandling ?? 0,
          taxableAmount: bill.taxableAmount,
          gstMode,
          gstPercent,
          taxAmount: bill.taxAmount,
          grandTotal: bill.grandTotal,
          notes: dto.notes,
          items: {
            create: dto.items.map((i) => ({
              serviceId: i.serviceId,
              itemName: i.itemName,
              serviceType: i.serviceType,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              lineTotal:
                Math.round((i.unitPrice * i.quantity + Number.EPSILON) * 100) /
                100,
            })),
          },
          invoice: {
            create: {
              shopId,
              invoiceNumber,
              grandTotal: bill.grandTotal,
              balance: bill.grandTotal,
              status: InvoiceStatus.PENDING,
            },
          },
        },
        include: { items: true, invoice: true, customer: true },
      });

      await tx.auditLog.create({
        data: {
          action: 'ORDER_CREATED',
          entity: 'Order',
          entityId: order.id,
          shopId,
          userId: user.userId,
          meta: { orderNumber, grandTotal: bill.grandTotal },
        },
      });

      return order;
    });
  }

  async findAll(
    user: AuthUser,
    opts: { status?: OrderStatus; shopId?: string },
  ) {
    const shopId = resolveShopId(user, opts.shopId);
    return this.prisma.order.findMany({
      where: {
        shopId,
        ...(opts.status ? { status: opts.status } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        invoice: { select: { status: true, balance: true, grandTotal: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(user: AuthUser, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        invoice: { include: { payments: true } },
        createdBy: { select: { id: true, name: true } },
        shop: {
          select: {
            name: true,
            address: true,
            phone: true,
            gstNumber: true,
            logoUrl: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    resolveShopId(user, order.shopId);
    return order;
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(user, id);
    const data: Prisma.OrderUpdateInput = { status: dto.status };
    if (dto.status === OrderStatus.DELIVERED) data.deliveredAt = new Date();

    const updated = await this.prisma.order.update({ where: { id }, data });
    await this.prisma.auditLog.create({
      data: {
        action: 'ORDER_STATUS_CHANGED',
        entity: 'Order',
        entityId: id,
        shopId: order.shopId,
        userId: user.userId,
        meta: { from: order.status, to: dto.status },
      },
    });
    return updated;
  }
}
