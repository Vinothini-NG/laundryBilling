import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ShopsService } from './shops.service';
import {
  CreateShopDto,
  UpdateShopDto,
  UpdateShopStatusDto,
} from './shops.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { AuthUser } from '../common/types';

@ApiTags('shops')
@ApiBearerAuth()
@Controller('shops')
export class ShopsController {
  constructor(private shops: ShopsService) {}

  @Post()
  @Roles(Role.PLATFORM_ADMIN)
  create(@Body() dto: CreateShopDto) {
    return this.shops.create(dto);
  }

  @Get()
  @Roles(Role.PLATFORM_ADMIN)
  findAll() {
    return this.shops.findAll();
  }

  // Any shop-scoped user may read their own shop (billing needs tax settings);
  // tenancy still blocks reading a different shop.
  @Get(':id')
  @Roles(Role.SHOP_ADMIN, Role.BILLING_EXECUTIVE, Role.PLATFORM_ADMIN)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.shops.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.SHOP_ADMIN, Role.PLATFORM_ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shops.update(user, id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.PLATFORM_ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateShopStatusDto) {
    return this.shops.updateStatus(id, dto);
  }
}
