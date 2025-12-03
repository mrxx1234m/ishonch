import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { TelegramUpdate } from './telegram.update';
import { TelegramHandlers } from './telegram-callback.handlers';

@Module({
  imports: [
    ConfigModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN')!,

        middlewares: [session()], // <-- MUHIM!
      }),
    }),
  ],
  providers: [TelegramUpdate, TelegramHandlers],
})
export class TelegramModule {}
