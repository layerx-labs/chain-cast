import { ChainIds, ChainSupported } from '../types';

export const chainsSupported: ChainSupported = {
  ethereum: {
    id: ChainIds.ETHEREUM,
    rpcUrl:
      process.env.WEB3_RPC_ETH_MAIN_NET_URL ||
      `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
    wsUrl:
      process.env.WEB3_WS_ETH_MAIN_NET_URL ||
      `wss://rpc.ankr.com/eth/ws/${process.env.ANKR_API_KEY}`,
    blockExplorer: 'https://etherscan.io',
    currency: 'ETH',
    currencyDecimals: 18,
    name: 'Ethereum Main Net',
    shortName: 'Ethereum',
    primaryColor: '#DDDDDD',
  },
  sepolia: {
    id: ChainIds.SEPOLIA,
    rpcUrl:
      process.env.WEB3_RPC_ETH_SEPOLIA_URL ||
      `https://rpc.ankr.com/eth_sepolia/${process.env.ANKR_API_KEY}`,
    wsUrl:
      process.env.WEB3_WS_ETH_SEPOLIA_URL ||
      `wss://rpc.ankr.com/eth_sepolia/ws/${process.env.ANKR_API_KEY}`,
    blockExplorer: 'https://sepolia.etherscan.io/',
    currency: 'ETH',
    currencyDecimals: 18,
    name: 'Sepolia Test Net',
    shortName: 'Sepolia',
    primaryColor: '#DDDDDD',
  },
  amoy: {
    id: ChainIds.AMOY,
    rpcUrl:
      process.env.WEB3_RPC_POLYGON_AMOY_URL ||
      `https://rpc.ankr.com/polygon_amoy/${process.env.ANKR_API_KEY}`,
    wsUrl:
      process.env.WEB3_WS_POLYGON_AMOY_URL ||
      `wss://rpc.ankr.com/polygon_amoy/ws/${process.env.ANKR_API_KEY}`,
    blockExplorer: 'https://etherscan.io',
    currency: 'MATIC',
    currencyDecimals: 18,
    name: 'Polygon Amoy Test Net',
    shortName: 'Polygon Amoy Test',
    primaryColor: '#DDDDDD',
  },
  polygon: {
    id: ChainIds.POLYGON,
    rpcUrl:
      process.env.WEB3_RPC_POLYGON_URL ||
      `https://rpc.ankr.com/polygon/${process.env.ANKR_API_KEY}`,
    wsUrl:
      process.env.WEB3_WS_POLYGON_URL ||
      `wss://rpc.ankr.com/polygon/ws/${process.env.ANKR_API_KEY}`,
    blockExplorer: 'https://polygonscan.io',
    currency: 'MATIC',
    currencyDecimals: 18,
    name: 'Mumbai Main Net',
    shortName: 'Polygon Main Net',
    primaryColor: '#DDDDDD',
  },
  // Arbitrum One Main Net
  arbitrum: {
    id: ChainIds.ARBITRUM_MAIN_NET,
    name: 'Arbitrum One Main Net',
    shortName: 'arbitrum',
    rpcUrl:
      process.env.WEB3_RPC_ARBITRUM_URL ||
      `https://rpc.ankr.com/arbitrum/${process.env.ANKR_API_KEY}`,
    wsUrl:
      process.env.WEB3_WS_ARBITRUM_URL ||
      `wss://rpc.ankr.com/arbitrum/ws/${process.env.ANKR_API_KEY}`,
    currency: 'ETH',
    currencyDecimals: 18,
    blockExplorer: 'https://arbiscan.io',
    primaryColor: '#DDDDDD',
  },
  // Optimism Main Net
  optimism: {
    id: ChainIds.OPTIMISM_MAIN_NET,
    name: 'Optimism Main Net',
    shortName: 'optimism',
    rpcUrl:
      process.env.WEB3_RPC_OPTIMISM_URL ||
      `https://rpc.ankr.com/optimism/${process.env.ANKR_API_KEY}`,
    wsUrl:
      process.env.WEB3_WS_OPTIMISM_URL ||
      `wss://rpc.ankr.com/optimism/ws/${process.env.ANKR_API_KEY}`,
    currency: 'ETH',
    currencyDecimals: 18,
    blockExplorer: 'https://optimistic.etherscan.io/',
    primaryColor: '#DDDDDD',
  },
  // Base Main Net
  base: {
    id: ChainIds.BASE_MAIN_NET,
    name: 'Base Main Net',
    shortName: 'base',
    rpcUrl:
      process.env.WEB3_RPC_BASE_URL || `https://rpc.ankr.com/base/${process.env.ANKR_API_KEY}`,
    wsUrl: process.env.WEB3_WS_BASE_URL || `wss://rpc.ankr.com/base/ws/${process.env.ANKR_API_KEY}`,
    currency: 'ETH',
    currencyDecimals: 18,
    blockExplorer: 'https://basescan.io/',
    primaryColor: '#DDDDDD',
  },
  local: {
    id: ChainIds.LOCAL,
    rpcUrl: process.env.WEB3_RPC_LOCAL_URL || 'http://127.0.0.1:8545',
    wsUrl: process.env.WEB3_WS_LOCAL_URL || 'ws://127.0.0.1:8545',
    currency: 'ETH',
    currencyDecimals: 18,
    name: 'Ganache Network',
    shortName: 'Local',
    primaryColor: '#DDDDDD',
  },
};
