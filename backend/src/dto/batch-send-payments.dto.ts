import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchSendPaymentItemDto {
  @IsString()
  @MinLength(3)
  recipientHandle!: string;

  @IsNumber()
  @Min(0.01)
  amountUsd!: number;

  @IsString()
  @MinLength(2)
  stablecoin!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  memo?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  idempotencyKey?: string;
}

export class BatchSendPaymentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSendPaymentItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: BatchSendPaymentItemDto[];

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  idempotencyPrefix?: string;

  @IsOptional()
  @IsBoolean()
  stopOnFirstFailure?: boolean;
}
