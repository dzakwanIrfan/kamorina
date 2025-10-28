// src/config/env.config.ts
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

  // App
  FRONTEND_URL: string;
  APP_PORT: number;
}