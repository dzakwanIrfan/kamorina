export interface EnvironmentVariables {
  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRATION: string;

  // Email
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  MAIL_FROM: string;

  // Redis (for BullMQ)
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;

  // App
  FRONTEND_URL: string;
  API_URL: string;
  BASE_URL: string;
  APP_PORT: number;
  NODE_ENV: string;
}