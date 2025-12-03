import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTariffDto } from './dto/tariff.dto';

@Injectable()
export class TariffService {
    constructor(private prisma:PrismaService){}
    async getAllTariff(){
        const result = await this.prisma.tariff.findMany()
        return result
    }
    async addTariff(createTariffDto:CreateTariffDto){
       
    // DTO obyektini Prisma create inputiga to‘g‘rilash
    const data = {
      serviceName: createTariffDto.serviceName,
      pricePerM2: createTariffDto.pricePerM2,
      description: createTariffDto.description,
      isActive: createTariffDto.isActive ?? true,
    };

    return this.prisma.tariff.create({ data });
  
    }
}
