import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // グローバルプレフィックスの設定 (例: /api/tasks)
  app.setGlobalPrefix('api');

  // Swaggerの設定
  const config = new DocumentBuilder()
    .setTitle('DevTaskManagementApp API')
    .setDescription('DevTaskManagementAppのAPI仕様書です。')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Swagger UIのエンドポイントを /api/docs に設定
  SwaggerModule.setup('api/docs', app, document);

  // CORSを安全に有効化 (環境変数 FRONTEND_URL を許可し、無ければ開発用の localhost:5173 を許可)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
