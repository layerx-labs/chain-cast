import { chainsSupported } from '@/constants/chains';
import { ChainIds } from '@/types/index';
import {
  http,
  type Chain,
  type HttpTransport,
  type PublicClient,
  type Transport,
  type WebSocketTransport,
  createPublicClient,
  defineChain,
  webSocket,
} from 'viem';
import { arbitrum, base, mainnet, optimism, polygon, polygonAmoy, sepolia } from 'viem/chains';

/**
 * Maps chain IDs to viem chain definitions.
 * For standard chains, uses viem's built-in definitions.
 * For local/custom chains, creates a custom definition.
 */
const viemChains: Record<number, Chain> = {
  [ChainIds.ETHEREUM]: mainnet,
  [ChainIds.SEPOLIA]: sepolia,
  [ChainIds.POLYGON]: polygon,
  [ChainIds.AMOY]: polygonAmoy,
  [ChainIds.ARBITRUM_MAIN_NET]: arbitrum,
  [ChainIds.OPTIMISM_MAIN_NET]: optimism,
  [ChainIds.BASE_MAIN_NET]: base,
};

/**
 * Creates a custom chain definition for local development or unsupported chains.
 *
 * @param chainId - The chain ID
 * @param name - Human-readable chain name
 * @param rpcUrl - HTTP RPC endpoint
 * @param currency - Native currency symbol
 * @param decimals - Currency decimals
 * @returns A viem Chain definition
 */
function createCustomChain(
  chainId: number,
  name: string,
  rpcUrl: string,
  currency: string,
  decimals: number
): Chain {
  return defineChain({
    id: chainId,
    name: name,
    nativeCurrency: {
      name: currency,
      symbol: currency,
      decimals: decimals,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
    },
  });
}

/**
 * Gets the viem Chain definition for a given chain ID.
 * Uses built-in definitions when available, otherwise creates a custom one.
 *
 * @param chainId - The blockchain network ID
 * @returns The viem Chain definition
 * @throws Error if the chain is not supported
 */
export function getViemChain(chainId: number): Chain {
  // Check if we have a built-in chain definition
  if (viemChains[chainId]) {
    return viemChains[chainId];
  }

  // Find the chain in our supported chains config
  const chainConfig = Object.values(chainsSupported).find((chain) => chain.id === chainId);

  if (!chainConfig) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  // Create a custom chain definition
  return createCustomChain(
    chainConfig.id,
    chainConfig.name,
    chainConfig.rpcUrl,
    chainConfig.currency,
    chainConfig.currencyDecimals
  );
}

/**
 * Configuration options for creating viem clients.
 */
export interface ViemClientOptions {
  /** Number of retry attempts for failed requests */
  retryCount?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable multicall batching for eth_call requests */
  batch?: boolean;
}

const DEFAULT_OPTIONS: Required<ViemClientOptions> = {
  retryCount: 5,
  retryDelay: 5000,
  timeout: 30000,
  batch: true,
};

/**
 * Creates an HTTP public client for the specified chain.
 *
 * @param chainId - The blockchain network ID
 * @param options - Optional client configuration
 * @returns A viem PublicClient configured for HTTP transport
 */
export function createHttpClient(
  chainId: number,
  options: ViemClientOptions = {}
): PublicClient<HttpTransport, Chain> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chain = getViemChain(chainId);

  // Find the RPC URL from our chain configuration
  const chainConfig = Object.values(chainsSupported).find((c) => c.id === chainId);
  const rpcUrl = chainConfig?.rpcUrl;

  return createPublicClient({
    chain,
    transport: http(rpcUrl, {
      retryCount: opts.retryCount,
      retryDelay: opts.retryDelay,
      timeout: opts.timeout,
    }),
    batch: opts.batch
      ? {
          multicall: true,
        }
      : undefined,
  });
}

/**
 * Creates a WebSocket public client for the specified chain.
 * Used for real-time event listening with automatic reconnection.
 *
 * @param chainId - The blockchain network ID
 * @param options - Optional client configuration
 * @returns A viem PublicClient configured for WebSocket transport
 */
export function createWebSocketClient(
  chainId: number,
  options: ViemClientOptions = {}
): PublicClient<WebSocketTransport, Chain> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chain = getViemChain(chainId);

  // Find the WebSocket URL from our chain configuration
  const chainConfig = Object.values(chainsSupported).find((c) => c.id === chainId);
  const wsUrl = chainConfig?.wsUrl;

  if (!wsUrl) {
    throw new Error(`No WebSocket URL configured for chain ID: ${chainId}`);
  }

  return createPublicClient({
    chain,
    transport: webSocket(wsUrl, {
      retryCount: opts.retryCount,
      retryDelay: opts.retryDelay,
      timeout: opts.timeout,
      keepAlive: {
        interval: 60000, // 60 seconds keepalive interval
      },
      reconnect: {
        attempts: opts.retryCount,
        delay: opts.retryDelay,
      },
    }),
  });
}

/**
 * Factory class for creating viem clients with consistent configuration.
 * Provides a higher-level API for creating clients based on chain ID.
 */
export class ViemClientFactory {
  private _options: Required<ViemClientOptions>;

  /**
   * Creates a new ViemClientFactory with the specified options.
   *
   * @param options - Configuration options for created clients
   */
  constructor(options: ViemClientOptions = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Creates an HTTP client for the specified chain.
   *
   * @param chainId - The blockchain network ID
   * @returns A viem PublicClient with HTTP transport
   */
  createHttpClient(chainId: number): PublicClient<HttpTransport, Chain> {
    return createHttpClient(chainId, this._options);
  }

  /**
   * Creates a WebSocket client for the specified chain.
   *
   * @param chainId - The blockchain network ID
   * @returns A viem PublicClient with WebSocket transport
   */
  createWebSocketClient(chainId: number): PublicClient<WebSocketTransport, Chain> {
    return createWebSocketClient(chainId, this._options);
  }

  /**
   * Gets the viem chain definition for a chain ID.
   *
   * @param chainId - The blockchain network ID
   * @returns The viem Chain definition
   */
  getChain(chainId: number): Chain {
    return getViemChain(chainId);
  }
}

/**
 * Type alias for any public client transport type.
 */
export type AnyPublicClient = PublicClient<Transport, Chain>;
