import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = {
          type: 'postgres' as const,
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_DATABASE', 'lms_db'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') !== 'production', // Enable sync for development
          logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn', 'log'] : ['error'],
          autoLoadEntities: true,
          retryAttempts: 3,
          retryDelay: 3000,
          connectTimeoutMS: 60000,
          acquireTimeoutMS: 60000,
          timeout: 60000,
          extra: {
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
          },
        };

        console.log('🔗 Database configuration:');
        console.log(`   Host: ${config.host}:${config.port}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   User: ${config.username}`);
        console.log(`   Sync: ${config.synchronize}`);
        console.log(`   Logging: ${config.logging}`);

        return config;
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}