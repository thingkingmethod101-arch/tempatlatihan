import { IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString() contentPricingId: string;

  @IsOptional() @IsString()
  kodeReferral?: string;
}