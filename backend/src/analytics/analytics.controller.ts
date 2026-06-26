import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, Roles } from '../common/decorators';
import { AuthUser } from '../common/types';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('shop')
  @Roles(Role.SHOP_ADMIN, Role.BILLING_EXECUTIVE, Role.PLATFORM_ADMIN)
  shop(@CurrentUser() user: AuthUser, @Query('shopId') shopId?: string) {
    return this.analytics.shopDashboard(user, shopId);
  }

  @Get('platform')
  @Roles(Role.PLATFORM_ADMIN)
  platform() {
    return this.analytics.platformDashboard();
  }
}
