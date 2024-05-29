import { LogLevel } from '@taikai/scribal';
import { __Config, Environment } from '@/types/index';

export const appConfig: __Config = {
  appName: 'chaincast',
  secret: process.env?.SERVER_KEY ?? 'secret',
  environment: (process.env.ENVIRONMENT_TYPE as Environment) || 'development',
  version: '1.0.0',
  port: Number(process.env.CHAIN_CAST_API_PORT) || 4400,
  recover: {
    blocksPerCall: Number(process.env.BLOCKS_PER_CALL) || 1000,
    retries: Number(process.env.GET_PAST_RETRIES) || 3,
    sleepMs: Number(process.env.RECOVER_SLEEP_MS) || 100,
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origins: process.env?.CORS_ALLOWED_ORIGINS?.split(',') ?? [],
  },
  ssl: {
    enabled: process.env.SSL_ENABLED === 'true' || false,
    sslPrivateKeyPath: process.env.SSL_PRIVATE_KEY_PATH || './config/key.pem',
    sslCertPath: process.env.SSL_CERT_PATH || './config/cert.pem',
    sslPrivateKeyPassphrase: process.env.SSL_PRIVATE_KEY_PASS || '123qwe',
  },
  logs: {
    console: {
      silent: process.env.SILENT === 'true',
      logLevel: (process.env.LOG_LEVEL ?? 'debug') as LogLevel,
      prettify: process.env.LOG_MSG_PRETTIFY === 'true',
    },
    file: {
      silent: process.env.LOG_TO_FILE === 'false',
      logLevel: (process.env.LOG_LEVEL || 'debug') as LogLevel,
      logFileDir: process.env.LOG_FILE_DIR || 'logs',
      logDailyRotation: process.env.DAILY_ROTATION_FILE === 'true',
      logDailyRotationOptions: {
        maxSize: process.env.DAILY_ROTATION_FILE_MAX_SIZE || '20m',
        datePattern: process.env.DAILY_ROTATION_FILE_DATE_PATTERN || 'YYYY-MM-DD',
      },
    },
  },
};
