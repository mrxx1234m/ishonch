import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { TelegramModule } from './telegram/telegram.module';
import { TariffModule } from './tariff/tariff.module';

@Module({
  imports: [ PrismaModule,TelegramModule, TariffModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
