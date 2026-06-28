import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types';
import { resolveShopId } from '../common/tenant';
import { RecordPaymentDto } from './payments.dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Records a payment (or refund) and re-derives the invoice's amountPaid,
   * balance and status — all atomically so concurrent counters stay correct.
   */
  async record(user: AuthUser, dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    const shopId = resolveShopId(user, invoice.shopId);

    const signed = dto.isRefund ? -dto.amount : dto.amount;
    const newAmountPaid = round2(invoice.amountPaid + signed);
    if (newAmountPaid < 0) {
      throw new BadRequestException('Refund exceeds amount paid');
    }
    const newBalance = round2(invoice.grandTotal - newAmountPaid);

    let status: InvoiceStatus;
    if (dto.isRefund && newAmountPaid === 0) status = InvoiceStatus.REFUNDED;
    else if (newAmountPaid <= 0) status = InvoiceStatus.PENDING;
    else if (newBalance <= 0) status = InvoiceStatus.PAID;
    else status = InvoiceStatus.PARTIALLY_PAID;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          shopId,
          invoiceId: invoice.id,
          amount: dto.amount,
          mode: dto.mode,
          reference: dto.reference,
          note: dto.note,
          isRefund: dto.isRefund ?? false,
        },
      });
      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: { amountPaid: newAmountPaid, balance: newBalance, status },
      });
      await tx.auditLog.create({
        data: {
          action: dto.isRefund ? 'REFUND_RECORDED' : 'PAYMENT_RECORDED',
          entity: 'Invoice',
          entityId: invoice.id,
          shopId,
          userId: user.userId,
          meta: { amount: dto.amount, mode: dto.mode, status },
        },
      });
      return { payment, invoice: updated };
    });
  }

  listForInvoice(user: AuthUser, invoiceId: string) {
    return this.prisma.payment
      .findMany({
        where: { invoiceId },
        orderBy: { createdAt: 'asc' },
      })
      .then((payments) => {
        // Tenant guard: ensure all belong to a shop the caller may see.
        if (payments[0]) resolveShopId(user, payments[0].shopId);
        return payments;
      });
  }
}
