import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/types';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private invoices: InvoicesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: InvoiceStatus,
    @Query('shopId') shopId?: string,
  ) {
    return this.invoices.findAll(user, { status, shopId });
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoices.findOne(user, id);
  }
}
