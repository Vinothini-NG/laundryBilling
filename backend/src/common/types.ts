import { Role } from '@prisma/client';

/** Shape of the authenticated principal attached to every request. */
export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  /** null for PLATFORM_ADMIN, set for all shop-scoped roles. */
  shopId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  shopId: string | null;
}
