import { Body, Controller, Get, Post } from '@nestjs/common';
import { TariffService } from './tariff.service';
import { ApiOperation } from '@nestjs/swagger';
import { CreateTariffDto } from './dto/tariff.dto';

@Controller('tariff')
export class TariffController {
  constructor(private readonly tariffService: TariffService) {}
  @Get()
  @ApiOperation({summary:"Get all tariff"})
  async getAllTariff(){
    const data = await this.tariffService.getAllTariff()
    return data
  }

  @Post()
  @ApiOperation({summary:'Add tariff'})
  async addTariff(@Body() body:CreateTariffDto){
    const data = await this.tariffService.addTariff(body)
    return data
  }
  
}
