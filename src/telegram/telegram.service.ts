import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService implements OnModuleInit {
  public bot: Telegraf;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('BOT_TOKEN');
    this.bot = new Telegraf(String(token));
  }

  onModuleInit() {
    this.bot.launch();
    console.log('Telegram bot started');
  }
}
