import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsUUID()
  shopId?: string;
}

export class UpdateServiceDto {
  @IsOptional() @IsString() itemName?: string;
  @IsOptional() @IsEnum(ServiceType) serviceType?: ServiceType;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
