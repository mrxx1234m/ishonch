import { Injectable } from '@nestjs/common';
import { Update, Start, Ctx, Action } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class TelegramUpdate {
  constructor(private prisma: PrismaService) {}
  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(
      'Assalomu alaykum! Sizni botimizda kutib olishdan xursandmiz 🙂',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Buyurtma berish', callback_data: 'order' }],
            [{ text: 'Narxlar', callback_data: 'prices' }],
            [{ text: 'Buyurtmalarim', callback_data: 'my_orders' }],
            [
              {
                text: 'Operator bilan aloqa',
                callback_data: 'contact_operator',
              },
            ],
          ],
        },
      },
    );
  }

  // Narxlar tugmasi bosilganda ishlaydi
  @Action('prices')
  async handlePrices(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const tariffs = await this.prisma.tariff.findMany({
      where: { isActive: true },
    });

    if (tariffs.length === 0) {
      await ctx.reply('Hozircha narxlar mavjud emas.');
      return;
    }

    for (const t of tariffs) {
      let message = `📌 *${t.serviceName}*\n`;
      message += `💵 Narx: *${t.pricePerM2} so‘m/m²*\n`;
      message += `🔻 Minimal: *${t.minimalPrice} so‘m*\n`;
      if (t.description) {
        message += `📝 ${t.description}\n`;
      }

      await ctx.reply(message, { parse_mode: 'Markdown' });
    }
  }

  @Action('order')
  async handleOrder(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('Buyurtma bo‘limi hozircha ishlanmoqda...');
  }

  @Action('my_orders')
  async handleMyOrders(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('Sizning buyurtmalaringiz shu yerda ko‘rinadi...');
  }

  @Action('contact_operator')
  async handleContactOperator(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('Operator bilan bog‘lanish uchun: +998 90 123 45 67');
  }
}
