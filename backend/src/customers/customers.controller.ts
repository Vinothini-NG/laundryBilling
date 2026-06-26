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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { AuthUser } from '../common/types';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@Roles(Role.SHOP_ADMIN, Role.BILLING_EXECUTIVE, Role.PLATFORM_ADMIN)
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomerDto) {
    return this.customers.create(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.customers.findAll(user, search, shopId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customers.findOne(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.update(user, id, dto);
  }
}
