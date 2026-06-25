import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMode } from '@prisma/client';

export class RecordPaymentDto {
  @IsUUID()
  invoiceId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMode)
  mode: PaymentMode;

  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() note?: string;

  /** Set true to log a refund (reduces amountPaid). */
  @IsOptional() @IsBoolean() isRefund?: boolean;
}
