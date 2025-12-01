import { Injectable } from '@nestjs/common';
import { Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Injectable()
export class TelegramHandlers {
  @Action('prices')
  async handlePrices(@Ctx() ctx: Context) {
    await ctx.answerCbQuery(); // Telegram popupni yopadi

    // Dummy DB data
    const prices = [
      { serviceName: 'Gilam yuvish', pricePerM2: 50000 },
      { serviceName: 'Kreslo yuvish', pricePerM2: 30000 },
    ];

    let message = 'Narxlar ro‘yxati:\n';
    prices.forEach((p) => {
      message += `${p.serviceName}: ${p.pricePerM2} so‘m/m²\n`;
    });

    await ctx.reply(message);
  }
}
