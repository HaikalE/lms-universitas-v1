import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enhanced CORS configuration for Docker environment
  const corsOrigins = [
    'http://localhost:3001', // Browser access
    'http://frontend:80',     // Frontend container access
    'http://127.0.0.1:3001',  // Alternative localhost
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow if origin is in the allowed list
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For development, also allow any localhost/127.0.0.1 origins
      if (process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }
      
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static files (uploaded files)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global prefix for API
  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  
  console.log(`🚀 LMS Backend running on: http://localhost:${port}`);
  console.log(`📁 File uploads available at: http://localhost:${port}/uploads/`);
  console.log(`🌐 API endpoints: http://localhost:${port}/api/`);
  console.log(`🔒 CORS enabled for origins:`, corsOrigins);
}

bootstrap();