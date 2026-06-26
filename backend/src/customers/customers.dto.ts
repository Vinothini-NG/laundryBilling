import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Required only when caller is PLATFORM_ADMIN. */
  @IsOptional()
  @IsUUID()
  shopId?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() notes?: string;
}
