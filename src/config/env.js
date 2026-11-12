import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  API_BASE_URL: process.env.API_BASE_URL || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '"Vartiq Newsroom" <newsroom@vartiq.com>',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  AI_SETTINGS_ENCRYPTION_KEY: process.env.AI_SETTINGS_ENCRYPTION_KEY || 'a807ff031e0346dd9d9dc9a2f8f7c2e2c49df9082fb30e0d7f3c8361ed59f4b0',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || 'BAcP7puTevytIAkMLQgIzbpzF-Clhevd2nKTbBLZLj35LFl6hoJ6Ed3EoBEtHT4rw5lGLuOxvNpi4qWZqCNx32U',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || 'qcRz2ZYe56WtVzkyJspR61I3jj1dJ63uO9sS4pQ3YHE',
  VAPID_EMAIL: process.env.VAPID_EMAIL || 'mailto:support@vartiq.com'
};
