import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/prescribe_platform_dev',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiry: process.env.JWT_EXPIRY || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || 'noreply@prescribe.platform',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'noreply@prescribe.platform',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  features: {
    fhir: process.env.FEATURE_FHIR === 'true',
    integrations: process.env.FEATURE_INTEGRATIONS === 'true',
    safetyChecks: process.env.FEATURE_SAFETY_CHECKS === 'true',
    auditLogging: process.env.FEATURE_AUDIT_LOGGING === 'true',
  },

  ai: {
    safetyEnabled: process.env.AI_SAFETY_ENABLED === 'true',
    safetyApiKey: process.env.AI_SAFETY_API_KEY || '',
  },

  integrations: {
    pharmacyGatewayUrl: process.env.PHARMACY_GATEWAY_URL || '',
    pharmacyGatewayKey: process.env.PHARMACY_GATEWAY_KEY || '',
  },
};
