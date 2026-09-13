import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const diizinkan =
        origin === 'http://localhost:3001' ||
        origin === 'http://192.168.0.110:3001' ||
        /\.trycloudflare\.com$/.test(origin);
      callback(null, diizinkan);
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();