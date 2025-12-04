import LogService from '@taikai/scribal';

/**
 * List of sensitive parameter names that should be redacted/filtered from logs.
 * These parameters contain secrets, keys, passwords, and other sensitive information
 * that should not appear in log files for security reasons.
 */
const blackListParams = [
  'reCaptchaSecret', // reCAPTCHA secret keys
  'prismaSecret', // Database connection secrets
  'appSecret', // Application secrets
  'sslPrivateKeyPath', // SSL certificate paths
  'sslCertPath', // SSL certificate paths
  'sslPrivateKeyPassphrase', // SSL private key passphrases
  'corsAllowedOrigins', // CORS origin configurations
  'googleProjectId', // Google Cloud project IDs
  'googleCloudBucketId', // Google Cloud Storage bucket IDs
  'secretToken', // Various secret tokens
  'password', // User passwords
  'dsn', // Data source names/connection strings
  'apiKey', // API keys for various services
  'newsletterListID', // Email newsletter list IDs
  'oauth2', // OAuth2 credentials
  'authPath', // Authentication paths
  'clientId', // OAuth client IDs
  'clientSecret', // OAuth client secrets
  'eos', // EOS blockchain credentials
  'contractAccount', // Blockchain contract accounts
  'privateKey', // Private cryptographic keys
  'eosNodeURL', // EOS node URLs
  'keosdNodeURL', // EOS keosd node URLs
  'userKey', // User-specific keys
  'secret', // Generic secrets
  'accountSID', // Twilio account SIDs
  'authToken', // Authentication tokens
  'verificationSID', // Twilio verification SIDs
  'tokenID', // Token identifiers
  'tokenSecret', // Token secrets
  'webhookSecret', // Webhook secrets
  'youtubeAPIKey', // YouTube API keys
  'vimeoClientId', // Vimeo client IDs
  'vimeoClientSecret', // Vimeo client secrets
  'vimeoAccessToken', // Vimeo access tokens
  'apolloAPIKey', // Apollo GraphQL API keys
  'apolloActive', // Apollo service status
  'mixPanelToken', // Mixpanel analytics tokens
  'sgAPIKey', // SendGrid API keys
  'databaseUrl', // Database connection URLs
  'redisHostname', // Redis server hostnames
  'serverUrl', // Server URLs
  'githubUsername', // GitHub usernames
  'tokens', // Generic token collections
  'token', // Generic tokens
];

/**
 * Application logger instance using Taikai Scribal logging service.
 * Automatically redacts sensitive parameters from log output for security.
 * Supports multiple log levels and outputs to console and files based on configuration.
 */
const log = new LogService(blackListParams, '*');

export default log;
