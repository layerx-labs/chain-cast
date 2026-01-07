import type { Environment, __Config } from '@/types/index';
import type { LogLevel } from '@taikai/scribal';

/**
 * Application configuration object containing all environment-based settings.
 * Values are sourced from environment variables with sensible defaults.
 */
export const appConfig: __Config = {
  // Basic application metadata
  appName: 'chaincast',
  secret: process.env?.SERVER_KEY ?? 'secret', // Server authentication key
  environment: (process.env.ENVIRONMENT_TYPE as Environment) || 'development',
  version: '1.0.0',

  // Server configuration
  port: Number(process.env.CHAIN_CAST_API_PORT) || 4400, // GraphQL API port

  // Blockchain data recovery settings
  recover: {
    blocksPerCall: Number(process.env.BLOCKS_PER_CALL) || 1000, // Blocks to fetch per API call
    retries: Number(process.env.GET_PAST_RETRIES) || 3, // Retry attempts for failed requests
    sleepMs: Number(process.env.RECOVER_SLEEP_MS) || 100, // Delay between retries in milliseconds
  },

  // Cross-Origin Resource Sharing settings
  cors: {
    enabled: process.env.CORS_ENABLED === 'true', // Enable CORS headers
    origins: process.env?.CORS_ALLOWED_ORIGINS?.split(',') ?? [], // Allowed CORS origins
  },

  // SSL/TLS configuration for HTTPS
  ssl: {
    enabled: process.env.SSL_ENABLED === 'true' || false, // Enable HTTPS
    sslPrivateKeyPath: process.env.SSL_PRIVATE_KEY_PATH || './config/key.pem', // Private key file path
    sslCertPath: process.env.SSL_CERT_PATH || './config/cert.pem', // Certificate file path
    sslPrivateKeyPassphrase: process.env.SSL_PRIVATE_KEY_PASS || '123qwe', // Private key passphrase
  },

  // Redis configuration for caching and queues
  redis: {
    hostname: process.env?.REDIS_HOSTNAME ?? 'localhost', // Redis server hostname
    port: Number(process.env.REDIS_PORT) || 6379, // Redis server port
  },

  // Logging configuration
  logs: {
    console: {
      silent: process.env.SILENT === 'true', // Disable console logging
      logLevel: (process.env.LOG_LEVEL ?? 'debug') as LogLevel, // Minimum log level for console
      prettify: process.env.LOG_MSG_PRETTIFY === 'true', // Pretty-print log messages
    },
    file: {
      silent: process.env.LOG_TO_FILE === 'false', // Enable file logging
      logLevel: (process.env.LOG_LEVEL || 'debug') as LogLevel, // Minimum log level for files
      logFileDir: process.env.LOG_FILE_DIR || 'logs', // Directory for log files
      logDailyRotation: process.env.DAILY_ROTATION_FILE === 'true', // Enable daily log rotation
      logDailyRotationOptions: {
        maxSize: process.env.DAILY_ROTATION_FILE_MAX_SIZE || '20m', // Max size before rotation
        datePattern: process.env.DAILY_ROTATION_FILE_DATE_PATTERN || 'YYYY-MM-DD', // Rotation date format
      },
    },
  },
};
