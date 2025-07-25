import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

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

  // Serve static files (uploaded files) with proper MIME types
  const uploadsPath = join(__dirname, '..', 'uploads');
  
  // PRIMARY ROUTE: Direct uploads access (no global prefix affects this)
  app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, path) => {
      // Set proper MIME types for different file extensions
      if (path.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      } else if (path.endsWith('.docx') || path.endsWith('.doc')) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment');
      } else if (path.endsWith('.pptx') || path.endsWith('.ppt')) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', 'attachment');
      } else if (path.endsWith('.xlsx') || path.endsWith('.xls')) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment');
      } else if (path.endsWith('.txt')) {
        res.setHeader('Content-Type', 'text/plain');
      } else if (path.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes'); // Enable video seeking
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24 hours
      } else if (path.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      } else if (path.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
      
      // Security headers optimized for video streaming
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow embedding for video players
      res.setHeader('X-XSS-Protection', '1; mode=block');
    },
    maxAge: '1d', // Cache files for 1 day
    etag: true,
    lastModified: true,
    dotfiles: 'deny', // Deny access to dotfiles for security
  }));

  // REMOVED: /api/uploads route to prevent confusion with global prefix
  // The global prefix will be applied to all routes defined in controllers
  // Static files should be served directly without prefix

  // Global prefix for API controllers only (not static files)
  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  
  console.log(`🚀 LMS Backend running on: http://localhost:${port}`);
  console.log(`📁 File uploads available at: http://localhost:${port}/uploads/`);
  console.log(`🌐 API endpoints: http://localhost:${port}/api/`);
  console.log(`🔒 CORS enabled for development`);
  console.log(`📄 Static file serving with proper MIME types enabled`);
  console.log(`🎥 Video streaming with Accept-Ranges headers enabled for attendance tracking`);
}

bootstrap();