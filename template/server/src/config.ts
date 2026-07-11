import 'dotenv/config';
import pkg from '../package.json';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set');
}

const port = Number.parseInt(process.env.PORT ?? '<<PORT>>', 10);
if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number');
}

const smtpPort = Number.parseInt(process.env.SMTP_PORT ?? '587', 10);
if (Number.isNaN(smtpPort)) {
  throw new Error('SMTP_PORT must be a valid number');
}

function asOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function asBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export const APP_VERSION: string = pkg.version;
export const PORT = port;
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
export const JWT_SECRET = jwtSecret ?? 'dev-secret-change-before-deploy';
export const DB_PATH = process.env.DB_PATH ?? './data/app.db';
export const DB_ENCRYPTION_KEY = asOptional(process.env.DB_ENCRYPTION_KEY);
export const TURNSTILE_SITE_KEY = asOptional(process.env.TURNSTILE_SITE_KEY);
export const TURNSTILE_SECRET_KEY = asOptional(process.env.TURNSTILE_SECRET_KEY);
export const SMTP_HOST = asOptional(process.env.SMTP_HOST);
export const SMTP_PORT = smtpPort;
export const SMTP_SECURE = asBoolean(process.env.SMTP_SECURE, false);
export const SMTP_USER = asOptional(process.env.SMTP_USER);
export const SMTP_PASS = asOptional(process.env.SMTP_PASS);
export const SMTP_FROM = asOptional(process.env.SMTP_FROM);
export const VAPID = {
  publicKey: asOptional(process.env.VAPID_PUBLIC_KEY),
  privateKey: asOptional(process.env.VAPID_PRIVATE_KEY),
  subject: process.env.VAPID_SUBJECT ?? `mailto:admin@<<PROJECT_NAME>>.local`,
};

// <<FEATURE_CONFIG_EXPORTS>>
