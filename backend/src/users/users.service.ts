import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';
import { CreateUserDto, UpdateUserDto } from './users.dto';

const STAFF_ROLES: Role[] = [
  Role.SHOP_ADMIN,
  Role.BILLING_EXECUTIVE,
  Role.LAUNDRY_STAFF,
];

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  shopId: true,
  createdAt: true,
  lastLoginAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateUserDto) {
    const shopId = resolveShopId(user, dto.shopId);

    // A SHOP_ADMIN cannot mint platform admins or escalate outside staff roles.
    if (user.role === Role.SHOP_ADMIN && !STAFF_ROLES.includes(dto.role)) {
      throw new ForbiddenException('Cannot assign this role');
    }

    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          passwordHash,
          role: dto.role,
          shopId,
        },
        select: safeSelect,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }
  }

  findAll(user: AuthUser, shopId?: string) {
    const sid = resolveShopId(user, shopId);
    return this.prisma.user.findMany({
      where: { shopId: sid },
      select: safeSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateUserDto) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');
    resolveShopId(user, target.shopId ?? undefined);

    const data: Prisma.UserUpdateInput = {
      name: dto.name,
      role: dto.role,
      isActive: dto.isActive,
    };
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: safeSelect,
    });
  }
}
