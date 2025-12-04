import { ChainCastManager } from '@/services/chaincast-manager';
import { ContractCastType, ContractCastStatus, PrismaClient } from '@prisma/client';
import LogService, { LogLevel } from '@taikai/scribal';
import { InstructionMap, Program, VirtualMachine } from './vm';
import { EventListenerHandler, Web3Event } from './events';
import { Model, Web3Connection } from '@taikai/dappkit';
import { ChainCastSecretManager } from '@/services/secret-manager';

/**
 * Application context provided to all GraphQL resolvers.
 * Contains the core services and dependencies needed throughout the application.
 */
export type AppContext = {
  db: PrismaClient; // Database client for data persistence
  log: LogService; // Logging service for application events
  manager: ChainCastManager<ContractCast, VirtualMachine, ChainCastSecretManager>; // Contract cast lifecycle manager
};

/**
 * Supported deployment environments for the application.
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Complete application configuration type.
 * Defines all configurable aspects of the ChainCast application including
 * server settings, blockchain connections, logging, and security options.
 */
export type __Config = {
  appName: string; // Application name identifier
  environment: Environment; // Current deployment environment
  version: string; // Application version string
  port: number; // HTTP/HTTPS server port
  secret: string; // Master encryption key for secrets

  // Blockchain data recovery settings
  recover: {
    blocksPerCall: number; // Number of blocks to fetch per API call during recovery
    sleepMs: number; // Delay between recovery calls in milliseconds
    retries: number; // Maximum retry attempts for failed recovery calls
  };

  // SSL/TLS configuration for HTTPS
  ssl: {
    enabled: boolean; // Whether to enable HTTPS
    sslPrivateKeyPath: string; // Path to SSL private key file
    sslCertPath: string; // Path to SSL certificate file
    sslPrivateKeyPassphrase: string; // Passphrase for encrypted private key
  };

  // Cross-Origin Resource Sharing settings
  cors: {
    enabled: boolean; // Whether CORS is enabled
    origins: string[]; // Allowed CORS origins
  };

  // Redis connection settings
  redis: {
    hostname: string; // Redis server hostname
    port: number; // Redis server port
  };

  // Logging configuration
  logs: {
    console: {
      silent: boolean; // Whether to disable console logging
      logLevel: LogLevel; // Minimum log level for console output
      prettify: boolean; // Whether to pretty-print console logs
    };
    file?: {
      silent: boolean; // Whether to disable file logging
      logLevel: LogLevel; // Minimum log level for file output
      logFileDir: string; // Directory for log files
      logDailyRotation: boolean; // Whether to rotate logs daily
      logDailyRotationOptions: {
        maxSize: string; // Maximum file size before rotation
        datePattern: string; // Date pattern for log file names
      };
    };
  };
};

/**
 * Union type of all supported blockchain network names.
 * Used as keys in the chain configuration mapping.
 */
export type ChainNames =
  | 'ethereum' // Ethereum Mainnet
  | 'amoy' // Polygon Amoy Testnet
  | 'local' // Local development network (Ganache/Hardhat)
  | 'polygon' // Polygon Mainnet
  | 'sepolia' // Ethereum Sepolia Testnet
  | 'arbitrum' // Arbitrum One Mainnet
  | 'base' // Base Mainnet
  | 'optimism'; // Optimism Mainnet

/**
 * Chain ID constants for all supported blockchain networks.
 * Maps human-readable network names to their numeric chain identifiers.
 */
export enum ChainIds {
  ETHEREUM = 1, // Ethereum Mainnet
  AMOY = 80002, // Polygon Amoy Testnet
  POLYGON = 137, // Polygon Mainnet
  LOCAL = process.env.LOCAL_CHAIN_ID ? Number(process.env.LOCAL_CHAIN_ID) : 1337, // Local development
  ARBITRUM_MAIN_NET = 42161, // Arbitrum One Mainnet
  OPTIMISM_MAIN_NET = 10, // Optimism Mainnet
  BASE_MAIN_NET = 8453, // Base Mainnet
  SEPOLIA = 11155111, // Ethereum Sepolia Testnet
}

/**
 * Configuration parameters for a blockchain network.
 * Contains all the information needed to connect to and interact with a blockchain.
 */
export type ChainParams = {
  id: number; // Numeric chain identifier
  rpcUrl: string; // HTTP RPC endpoint URL
  wsUrl: string; // WebSocket RPC endpoint URL
  blockExplorer?: string; // Block explorer URL (optional)
  currency: string; // Native currency symbol (e.g., 'ETH', 'MATIC')
  currencyDecimals: number; // Number of decimal places for the currency
  name: string; // Full network name
  shortName: string; // Short network name for UI
  primaryColor: string; // Primary brand color for the network
};

/**
 * Complete mapping of all supported blockchain networks.
 * Provides configuration for each network keyed by its ChainNames identifier.
 */
export type ChainSupported = {
  [key in ChainNames]: ChainParams;
};

/**
 * Interface providing essential information about a contract cast instance.
 * Used by virtual machines and other components to access cast metadata.
 */
export type CastInfo = {
  getId(): string; // Unique identifier for the cast
  getAddress(): string; // Contract address being monitored
  getChainId(): number; // Blockchain network ID
  getBlockNumber(): number; // Starting block number for monitoring
};

/**
 * Enumeration of possible contract cast operational states.
 * Represents the lifecycle phases of a contract monitoring instance.
 */
export enum ContractCastStatusEnum {
  IDLE = 'IDLE', // Cast is initialized but not active
  RECOVERING = 'RECOVERING', // Cast is recovering historical events
  LISTENING = 'LISTENING', // Cast is actively listening for new events
  TERMINATED = 'TERMINATED', // Cast has been stopped/terminated
}

/**
 * Core interface for contract cast implementations.
 * Defines the contract for classes that monitor blockchain contracts
 * and execute programs in response to events.
 */
export type ContractCast = {
  getStatus(): ContractCastStatus; // Get current operational status
  loadProgram(program: Program): Promise<void>; // Load and initialize instruction program
  loadSecrets(secrets: SecretMap): Promise<void>; // Load encrypted secrets for the cast
  getSecretsManager(): SecretManager; // Get the secret manager instance
  start(): Promise<void>; // Start monitoring and event processing
  stop(): Promise<void>; // Stop monitoring and cleanup resources
  onEvent<N extends string, T>(event: Web3Event<N, T>): Promise<void>; // Handle blockchain event
  onError(error: Error): void; // Handle errors during operation
};

/**
 * Constructor signature for contract cast implementations.
 * Defines the parameters required to instantiate a new contract cast instance.
 */
export type ContractCastConstructor<T, S, VM> = new (
  creator: new () => S, // Constructor for secret manager
  vmConstructor: new (info: CastInfo, supportedInstructions: InstructionMap) => VM, // Constructor for virtual machine
  id: string, // Unique cast identifier
  type: ContractCastType, // Contract type (ERC20, ERC721, etc.)
  name: string | null, // Optional human-readable name
  adress: string, // Contract address (note: should be "address")
  chainId: number, // Blockchain network ID
  abi: string, // Contract ABI as JSON string
  blockNumber: number, // Starting block number
  transactionIndex: number, // Starting transaction index
  processors: InstructionMap // Available instruction processors
) => T;

/**
 * Constructor signature for blockchain contract models.
 * Used by the ModelFactory to create contract instances.
 */
export type ModelConstructor<M> = new (
  web3Con: Web3Connection, // Web3 connection instance
  address: string // Contract address
) => M;

/**
 * Constructor signature for contract event listeners.
 * Creates listeners that can monitor blockchain events and forward them to handlers.
 */
export type ContractEventListenerConstructor<M, H extends EventListenerHandler> = new (
  modelConstructor: ModelConstructor<M>, // Contract model constructor
  wsUrl: string, // WebSocket RPC URL
  address: string, // Contract address
  handler: H // Event handler instance
) => M;

/**
 * Constructor signature for basic contract listeners.
 * Simplified constructor for contract models without event handling.
 */
export type ContractListenerConstructor<M extends Model> = new (
  web3Con: Web3Connection, // Web3 connection instance
  address: string // Contract address
) => M;

/**
 * Type for a collection of secrets stored as key-value pairs.
 * Used throughout the application for managing encrypted sensitive data.
 */
export type SecretMap = { [key: string]: string };

/**
 * Interface for secret management implementations.
 * Defines the contract for classes that handle secure storage and retrieval of secrets.
 */
export type SecretManager = {
  addSecrets(secrets: SecretMap): void; // Bulk add multiple secrets
  addSecret(name: string, value: string): void; // Add single secret
  deleteSecret(name: string): void; // Remove a secret
  updateSecret(name: string, value: string): void; // Update existing secret
  getSecret(name: string): string | Buffer; // Retrieve a secret value
  getSecrets(): SecretMap; // Get all secrets as map
};
