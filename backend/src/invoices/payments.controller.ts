import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './payments.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { AuthUser } from '../common/types';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post()
  @Roles(Role.SHOP_ADMIN, Role.BILLING_EXECUTIVE, Role.PLATFORM_ADMIN)
  record(@CurrentUser() user: AuthUser, @Body() dto: RecordPaymentDto) {
    return this.payments.record(user, dto);
  }

  @Get('invoice/:invoiceId')
  list(
    @CurrentUser() user: AuthUser,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.payments.listForInvoice(user, invoiceId);
  }
}
