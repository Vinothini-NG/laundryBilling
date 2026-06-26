import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './services.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { AuthUser } from '../common/types';

@ApiTags('services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private services: ServicesService) {}

  // Read access for any shop-scoped staff (billing needs the price list).
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('shopId') shopId?: string) {
    return this.services.findAll(user, shopId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.services.findOne(user, id);
  }

  // Mutations restricted to admins (price changes are sensitive).
  @Post()
  @Roles(Role.SHOP_ADMIN, Role.PLATFORM_ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.services.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.SHOP_ADMIN, Role.PLATFORM_ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.update(user, id, dto);
  }
}
