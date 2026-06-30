import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, ShopStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/types';
import { LoginDto, RegisterShopDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });
  }

  /** Creates a shop + its first SHOP_ADMIN in one transaction. */
  async registerShop(dto: RegisterShopDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: dto.shopName,
          phone: dto.phone,
          email,
          status: ShopStatus.TRIAL,
        },
      });
      const user = await tx.user.create({
        data: {
          name: dto.ownerName,
          email,
          passwordHash,
          role: Role.SHOP_ADMIN,
          shopId: shop.id,
        },
      });
      return { shop, user };
    });

    return this.issueToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });
  }

  private async issueToken(payload: JwtPayload) {
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        shopId: payload.shopId,
      },
    };
  }
}
