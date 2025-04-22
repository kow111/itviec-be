import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { TransformInterceptor } from './core/transform.interceptor';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  //validation
  app.useGlobalPipes(new ValidationPipe());
  //cors
  app.enableCors();
  //cookie
  app.use(cookieParser());
  //versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  await app.listen(configService.get<string>('PORT') ?? 3000);
}
bootstrap();
