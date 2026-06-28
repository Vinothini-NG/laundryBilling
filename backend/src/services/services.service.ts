import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';
import { CreateServiceDto, UpdateServiceDto } from './services.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateServiceDto) {
    const shopId = resolveShopId(user, dto.shopId);
    try {
      return await this.prisma.service.create({
        data: {
          shopId,
          itemName: dto.itemName,
          serviceType: dto.serviceType,
          price: dto.price,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'This item + service combination already exists',
        );
      }
      throw e;
    }
  }

  findAll(user: AuthUser, shopId?: string) {
    const sid = resolveShopId(user, shopId);
    return this.prisma.service.findMany({
      where: { shopId: sid },
      orderBy: [{ serviceType: 'asc' }, { itemName: 'asc' }],
    });
  }

  async findOne(user: AuthUser, id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    resolveShopId(user, service.shopId);
    return service;
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceDto) {
    await this.findOne(user, id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }
}
