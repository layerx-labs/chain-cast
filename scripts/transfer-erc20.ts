import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  parseUnits,
  getContract,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { chainsSupported } from '@/constants/chains';
import Accounts from './accounts-testing';

// Standard ERC20 ABI for transfers
const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Define local chain for Ganache
const localChain = defineChain({
  id: chainsSupported.local.id,
  name: chainsSupported.local.name,
  nativeCurrency: {
    name: chainsSupported.local.currency,
    symbol: chainsSupported.local.currency,
    decimals: chainsSupported.local.currencyDecimals,
  },
  rpcUrls: {
    default: {
      http: [chainsSupported.local.rpcUrl],
    },
  },
});

async function main() {
  // Update this address with your deployed ERC20 contract address
  const TOKEN_ADDRESS = '0x37ebdd9B2adC5f8af3993256859c1Ea3BFE1465e' as `0x${string}`;
  const TOKEN_AMOUNT = 1000000n; // Amount in smallest unit (no decimals)
  const [owner, recipient] = Accounts;

  // Create account from private key
  const account = privateKeyToAccount(owner.privKey as `0x${string}`);

  // Create wallet client for transactions
  const walletClient = createWalletClient({
    account,
    chain: localChain,
    transport: http(chainsSupported.local.rpcUrl),
  });

  // Create public client for reading
  const publicClient = createPublicClient({
    chain: localChain,
    transport: http(chainsSupported.local.rpcUrl),
  });

  // Get contract instance
  const erc20 = getContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    client: { public: publicClient, wallet: walletClient },
  });

  console.log(`Transferring tokens from ${owner.address} to ${recipient.address}...`);

  try {
    // Get token symbol and decimals
    const symbol = await erc20.read.symbol();
    const decimals = await erc20.read.decimals();

    // Get balance before transfer
    const balanceBefore = await erc20.read.balanceOf([recipient.address as `0x${string}`]);
    console.log(`Recipient balance before: ${balanceBefore} ${symbol}`);

    // Execute transfer
    const hash = await erc20.write.transfer([recipient.address as `0x${string}`, TOKEN_AMOUNT]);

    console.log(`Transaction hash: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

    // Get balance after transfer
    const balanceAfter = await erc20.read.balanceOf([recipient.address as `0x${string}`]);
    console.log(`Recipient balance after: ${balanceAfter} ${symbol}`);

    console.log(
      `\nTransferred ${TOKEN_AMOUNT} ${symbol} from ${owner.address} to ${recipient.address}`
    );
  } catch (error: any) {
    console.error('Transfer failed:', error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log('😎 Transfer Done 🎉');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
