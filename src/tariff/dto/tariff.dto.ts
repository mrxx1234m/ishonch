// src/tariff/dto/create-tariff.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTariffDto {
  @ApiProperty({ description: 'Tarif nomi' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'Kvadrat metr uchun narx', minimum: 0 })
  @IsNumber()
  @Min(0)
  pricePerM2: number;

  @ApiPropertyOptional({ description: 'Minimal narx (default 0)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimalPrice?: number;

  @ApiPropertyOptional({ description: 'Tarif tavsifi' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tarif faolligi', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
