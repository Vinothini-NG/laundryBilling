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
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, AssignOrderDto } from './orders.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { AuthUser } from '../common/types';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  // Billing staff and admins create orders / bills.
  @Post()
  @Roles(Role.SHOP_ADMIN, Role.BILLING_EXECUTIVE, Role.PLATFORM_ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: OrderStatus,
    @Query('shopId') shopId?: string,
  ) {
    return this.orders.findAll(user, { status, shopId });
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.findOne(user, id);
  }

  // Laundry staff may move orders through the processing lifecycle.
  @Patch(':id/status')
  @Roles(
    Role.SHOP_ADMIN,
    Role.BILLING_EXECUTIVE,
    Role.LAUNDRY_STAFF,
    Role.PLATFORM_ADMIN,
  )
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user, id, dto);
  }

  @Patch(':id/assign')
  @Roles(Role.SHOP_ADMIN, Role.PLATFORM_ADMIN)
  assignOrder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignOrderDto,
  ) {
    return this.orders.assignOrder(user, id, dto);
  }

}
