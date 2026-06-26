import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { DiscountType, GstMode, OrderStatus, ServiceType } from '@prisma/client';

export class OrderItemDto {
  /** Optional: link to a catalog Service; price/name snapshotted from it if given. */
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional() @IsEnum(DiscountType) discountType?: DiscountType;
  @IsOptional() @IsNumber() @Min(0) discountValue?: number;

  @IsOptional() @IsNumber() @Min(0) expressCharge?: number;
  @IsOptional() @IsNumber() @Min(0) pickupCharge?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryCharge?: number;
  @IsOptional() @IsNumber() @Min(0) specialHandling?: number;

  /** Override shop tax defaults for this order if supplied. */
  @IsOptional() @IsEnum(GstMode) gstMode?: GstMode;
  @IsOptional() @IsNumber() @Min(0) gstPercent?: number;

  @IsOptional() @IsString() notes?: string;

  /** Required only when caller is PLATFORM_ADMIN. */
  @IsOptional() @IsUUID() shopId?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
