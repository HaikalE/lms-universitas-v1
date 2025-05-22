import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'lms_user'),
  password: configService.get('DB_PASSWORD', 'lms_password'),
  database: configService.get('DB_DATABASE', 'lms_db'),
  entities: [
    'src/**/*.entity{.ts,.js}',
  ],
  migrations: [
    'src/database/migrations/*{.ts,.js}',
  ],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
});
