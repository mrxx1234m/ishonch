import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('Product API with image upload')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // faqat DTO’da ko‘rsatilgan maydonlar qabul qilinadi
      forbidNonWhitelisted: true, // noto‘g‘ri maydon bo‘lsa xato beradi
      transform: true, // avtomatik tipga o‘tkazadi (masalan string -> number)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Running is port http://localhost:${process.env.PORT || 3000}/api`,
  );
}
bootstrap();
