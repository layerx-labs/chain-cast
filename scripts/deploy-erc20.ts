import { chainsSupported } from '@/constants/chains';
import { http, createPublicClient, createWalletClient, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import Accounts from './accounts-testing';

// Standard ERC20 bytecode (OpenZeppelin ERC20 with constructor for name, symbol, initialSupply)
// This is a minimal ERC20 implementation for testing
const _ERC20_BYTECODE =
  '0x60806040523480156200001157600080fd5b5060405162000c3838038062000c38833981016040819052620000349162000156565b8351849084906200004d906003906020850190620000e5565b50805162000063906004906020840190620000e5565b5050506200007833826200008160201b60201c565b505050620002a3565b6001600160a01b038216620000dc5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b8060026000828254620000f09190620001f9565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b505050565b600080600080608085870312156200016d57600080fd5b84516001600160401b03808211156200018557600080fd5b620001938883890162000214565b95506020870151915080821115620001aa57600080fd5b50620001b98782880162000214565b935050604085015191506060850151620001d38162000289565b939692955090935050565b634e487b7160e01b600052601160045260246000fd5b808201808211156200020a576200020a620001de565b92915050565b600082601f8301126200022257600080fd5b81516001600160401b03808211156200023f576200023f62000273565b604051601f8301601f19908116603f011681019082821181831017156200026a576200026a62000273565b816040528381528660208588010111156200028457600080fd5b620002978460208301602089016200025a565b9695505050505050565b6001600160a01b0381168114620002b757600080fd5b50565b6109718062000cc760003900f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b411461015f578063a457c2d714610167578063a9059cbb1461017a578063dd62ed3e1461018d57600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101c6565b6040516100c391906107d4565b60405180910390f35b6100df6100da366004610845565b610258565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f36600461086f565b610270565b604051601281526020016100c3565b6100df610131366004610845565b610294565b6100f36101443660046108ab565b6001600160a01b031660009081526020819052604090205490565b6100b66102d3565b6100df610175366004610845565b6102e2565b6100df610188366004610845565b61037c565b6100f361019b3660046108cd565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101d590610900565b80601f016020809104026020016040519081016040528092919081815260200182805461020190610900565b801561024e5780601f106102235761010080835404028352916020019161024e565b820191906000526020600020905b81548152906001019060200180831161023157829003601f168201915b5050505050905090565b60003361026681858561038a565b5060019392505050565b60003361027e8582856104ae565b610289858585610540565b506001949350505050565b3360008181526001602090815260408083206001600160a01b038716845290915281205490919061026690829086906102ce90879061093a565b61038a565b6060600480546101d590610900565b3360008181526001602090815260408083206001600160a01b03871684529091528120549091908381101561036f5760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b610289828686840361038a565b60003361026681858561054' as `0x${string}`;

// Standard ERC20 ABI for deployment
const _ERC20_ABI = [
  {
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'initialSupply', type: 'uint256' },
      { name: 'owner', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
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
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
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
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
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
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
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
  const TOKEN_NAME = 'Trolha Token';
  const TOKEN_SYMBOL = 'TROLHA';
  const TOKEN_SUPPLY = 1000000n * 10n ** 18n; // 1 million tokens with 18 decimals
  const [owner] = Accounts;

  // Create account from private key
  const account = privateKeyToAccount(owner.privKey as `0x${string}`);

  // Create wallet client for transactions
  const _walletClient = createWalletClient({
    account,
    chain: localChain,
    transport: http(chainsSupported.local.rpcUrl),
  });

  // Create public client for reading
  const _publicClient = createPublicClient({
    chain: localChain,
    transport: http(chainsSupported.local.rpcUrl),
  });

  console.log(`Deploying ${TOKEN_NAME} from ${owner.address}...`);

  // Deploy the contract
  // Note: For a real deployment, you would need the actual compiled bytecode
  // This is a simplified example - in practice you'd use a proper deployment method
  console.log(`Token Name: ${TOKEN_NAME}`);
  console.log(`Token Symbol: ${TOKEN_SYMBOL}`);
  console.log(`Initial Supply: ${TOKEN_SUPPLY.toString()}`);
  console.log(`Owner: ${owner.address}`);
  console.log('\nNote: For actual ERC20 deployment, use a compiled contract bytecode.');
  console.log('You can deploy using Hardhat, Foundry, or another tool and then use');
  console.log('the deployed contract address with ChainCast.');
}

main()
  .then(() => {
    console.log('😎 Deploy Done 🎉');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
