import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GstMode, ShopStatus, SubscriptionPlan } from '@prisma/client';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(SubscriptionPlan) subscriptionPlan?: SubscriptionPlan;
}

export class UpdateShopDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() invoicePrefix?: string;
  @IsOptional() @IsEnum(GstMode) gstMode?: GstMode;
  @IsOptional() @IsNumber() @Min(0) gstPercent?: number;
}

export class UpdateShopStatusDto {
  @IsEnum(ShopStatus)
  status: ShopStatus;
}
