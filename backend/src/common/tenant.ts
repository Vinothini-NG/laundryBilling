import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from './types';

/**
 * Resolves the shop a request should operate on.
 *
 * Shop-scoped users are pinned to their own `shopId` — any `requestedShopId`
 * they pass that differs is rejected. A PLATFORM_ADMIN has no shop of their
 * own, so they must name the shop explicitly via `requestedShopId`.
 *
 * Returning this value and feeding it into every Prisma `where` clause is what
 * keeps tenants isolated in the shared database.
 */
export function resolveShopId(
  user: AuthUser,
  requestedShopId?: string,
): string {
  if (user.role === Role.PLATFORM_ADMIN) {
    if (!requestedShopId) {
      throw new BadRequestException(
        'Platform admin must specify a shopId for this operation',
      );
    }
    return requestedShopId;
  }

  if (!user.shopId) {
    throw new ForbiddenException('User is not associated with a shop');
  }

  if (requestedShopId && requestedShopId !== user.shopId) {
    throw new ForbiddenException('Cannot access another shop’s data');
  }

  return user.shopId;
}
