import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  providers: [InvoicesService, PaymentsService],
  controllers: [InvoicesController, PaymentsController],
  exports: [InvoicesService, PaymentsService],
})
export class InvoicesModule {}
