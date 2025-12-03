import { Injectable } from '@nestjs/common';
import { Update, Start, Ctx, Action, On } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { Context } from 'telegraf';

interface OrderSession {
  step?: string;
  area?: number;
  tariffId?: number;
  fullName?: string;
  phone?: string;
  address?: string;
  comment?: string;
}

@Update()
@Injectable()
export class TelegramUpdate {
  constructor(private prisma: PrismaService) {}

  /** START BOT */
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

  /** SHOW PRICES */
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
      if (t.description) message += `📝 ${t.description}\n`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    }
  }

  /** BUYURTMA BOSHLASH */
  @Action('order')
  async handleOrder(@Ctx() ctx: any) {
    ctx.session = ctx.session || {};
    ctx.session.order = {} as OrderSession;

    ctx.session.order.step = 'awaiting_area';

    await ctx.reply(
      '🧮 Buyurtma berish jarayoni boshlandi!\n\n' +
        'Gilam maydonini *m²* da kiriting. Masalan: 12.5',
      { parse_mode: 'Markdown' },
    );
  }

  /** TEXT INPUT HANDLER */
  @On('text')
  async handleText(@Ctx() ctx: any) {
    ctx.session = ctx.session || {};
    const order: OrderSession = ctx.session.order;
    if (!order || !order.step) return;

    const text = ctx.message.text.trim();

    switch (order.step) {
      /** STEP 1: AREA */
      case 'awaiting_area':
        const area = parseFloat(text);
        if (isNaN(area) || area <= 0) {
          return await ctx.reply('❗️ To‘g‘ri maydon kiriting. Masalan: 12.5');
        }
        order.area = area;

        // Tarifflar ro‘yxati
        const tariffs = await this.prisma.tariff.findMany({
          where: { isActive: true },
        });
        if (!tariffs.length) {
          await ctx.reply(
            '❗️ Hozircha xizmat mavjud emas. Admin bilan bog‘laning.',
          );
          return;
        }


        // Inline keyboard orqali xizmat tanlash
        const buttons = tariffs.map((t) => [
          { text: t.serviceName, callback_data: `tariff_${t.id}` },
        ]);

        order.step = 'awaiting_tariff';
        await ctx.reply('Xizmat turini tanlang:', {
          reply_markup: { inline_keyboard: buttons },
        });
        break;

      /** STEP 2: FULL NAME */
      case 'awaiting_fullName':
        if (!text) return await ctx.reply('❗️ Ism va familiya kiriting.');
        order.fullName = text;
        order.step = 'awaiting_phone';
        await ctx.reply('Telefon raqamingizni kiriting:');
        break;

      /** STEP 3: PHONE */
      case 'awaiting_phone':
        if (!text.match(/^\+?\d{9,15}$/)) {
          return await ctx.reply(
            '❗️ To‘g‘ri telefon raqam kiriting. Masalan: +998901234567',
          );
        }
        order.phone = text;
        order.step = 'awaiting_address';
        await ctx.reply('Manzilingizni kiriting:');
        break;

      /** STEP 4: ADDRESS */
      case 'awaiting_address':
        if (!text) return await ctx.reply('❗️ Manzilni kiriting.');
        order.address = text;
        order.step = 'awaiting_comment';
        await ctx.reply(
          'Izoh (agar kerak bo‘lsa) kiriting yoki - tugmasini bosing:',
        );
        break;

      /** STEP 5: COMMENT & CONFIRMATION */
      case 'awaiting_comment':
        order.comment = text === '-' ? null : text;

        // FINAL STEP: SAVE ORDER
        const tgId = String(ctx.from.id);
        let user = await this.prisma.user.findUnique({
          where: { telegramId: tgId },
        });
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              telegramId: tgId,
              fullName: order.fullName,
              phone: order.phone,
            },
          });
        } else {
          // update user info
          await this.prisma.user.update({
            where: { id: user.id },
            data: { fullName: order.fullName, phone: order.phone },
          });
        }

        // get tariff
        const tariff = await this.prisma.tariff.findUnique({
          where: { id: order.tariffId },
        });
        if (!tariff) return await ctx.reply('❗️ Xizmat topilmadi.');

        // price calculation
        const totalPrice = Math.max(
          order.area || 0 * tariff.pricePerM2,
        );

        const createdOrder = await this.prisma.order.create({
          data: {
            userId: user.id,
            address: order.address,
            fullName: order.fullName,
            phone: order.phone,
            comment: order.comment,
            status: 'PENDING',
            items: {
              create: [
                {
                  tariffId: tariff.id,
                  area: order.area || 0,
                  price: totalPrice,
                },
              ],
            },
          },
          include: { items: true },
        });


        await ctx.reply(
          `✅ Buyurtma saqlandi!\n\n` +
            `📌 Xizmat: *${tariff.serviceName}*\n` +
            `📐 Maydon: *${order.area} m²*\n` +
            `💰 Narx: *${totalPrice} so‘m*\n` +
            `🆔 Buyurtma ID: *${createdOrder.id}*\n\n` +
            `Operator tez orada siz bilan bog‘lanadi.`,
          { parse_mode: 'Markdown' },
        );

        ctx.session.order = null; // clear session
        break;

      default:
        return;
    }
  }

  /** HANDLE TARIFF CALLBACK */
  @On('callback_query')
  async handleCallback(@Ctx() ctx: any) {
    ctx.session = ctx.session || {};
    const order: OrderSession = ctx.session.order;
    if (!order || !order.step) return;

    const data: string = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (order.step === 'awaiting_tariff' && data.startsWith('tariff_')) {
      const tariffId = parseInt(data.split('_')[1]);
      order.tariffId = tariffId;
      order.step = 'awaiting_fullName';
      await ctx.reply('To‘liq ism va familiyangizni kiriting:');
    }
  }

  /** MY ORDERS */
  @Action('my_orders')
  async handleMyOrders(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('Sizning buyurtmalaringiz shu yerda ko‘rinadi...');
  }

  /** CONTACT OPERATOR */
  @Action('contact_operator')
  async handleContactOperator(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply(
      `Qo‘llab-quvvatlash xizmati:\n+998-90-123-45-67\nSavollaringiz bo‘lsa, bemalol murojaat qiling.`,
    );
  }
}
