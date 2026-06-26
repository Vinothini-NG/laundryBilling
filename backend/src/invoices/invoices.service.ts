import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  findAll(
    user: AuthUser,
    opts: { status?: InvoiceStatus; shopId?: string },
  ) {
    const shopId = resolveShopId(user, opts.shopId);
    return this.prisma.invoice.findMany({
      where: { shopId, ...(opts.status ? { status: opts.status } : {}) },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: { select: { name: true, mobile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(user: AuthUser, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { createdAt: 'asc' } },
        order: {
          include: { items: true, customer: true },
        },
        shop: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            gstNumber: true,
            logoUrl: true,
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    resolveShopId(user, invoice.shopId);
    return invoice;
  }
}
