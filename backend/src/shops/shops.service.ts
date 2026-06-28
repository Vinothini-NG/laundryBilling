import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';
import {
  CreateShopDto,
  UpdateShopDto,
  UpdateShopStatusDto,
} from './shops.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  // Platform admin only.
  create(dto: CreateShopDto) {
    return this.prisma.shop.create({ data: dto });
  }

  // Platform admin only — every shop on the platform.
  findAll() {
    return this.prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true, customers: true, users: true } },
      },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const shopId = resolveShopId(user, id);
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  /** Settings update — a SHOP_ADMIN may only edit their own shop. */
  async update(user: AuthUser, id: string, dto: UpdateShopDto) {
    const shopId = resolveShopId(user, id);
    return this.prisma.shop.update({ where: { id: shopId }, data: dto });
  }

  // Platform admin only — suspend / activate.
  updateStatus(id: string, dto: UpdateShopStatusDto) {
    return this.prisma.shop.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
