import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateCustomerDto) {
    const shopId = resolveShopId(user, dto.shopId);
    try {
      return await this.prisma.customer.create({
        data: {
          shopId,
          name: dto.name,
          mobile: dto.mobile,
          email: dto.email,
          address: dto.address,
          notes: dto.notes,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'A customer with this mobile already exists in this shop',
        );
      }
      throw e;
    }
  }

  async findAll(user: AuthUser, search?: string, shopId?: string) {
    const sid = resolveShopId(user, shopId);
    return this.prisma.customer.findMany({
      where: {
        shopId: sid,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(user: AuthUser, id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    // Tenant check: confirm caller may see this shop's data.
    resolveShopId(user, customer.shopId);
    return customer;
  }

  async update(user: AuthUser, id: string, dto: UpdateCustomerDto) {
    await this.findOne(user, id); // tenant-guarded existence check
    return this.prisma.customer.update({ where: { id }, data: dto });
  }
}
