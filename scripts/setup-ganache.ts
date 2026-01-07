import fs from 'node:fs';
import path from 'node:path';
import { chainsSupported } from '@/constants/chains';
import { createContractCast } from '@/lib/api';
import { http, createPublicClient, createWalletClient, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import Accounts from './accounts-testing';

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
  console.log('🚀 Starting ChainCast Ganache Setup...\n');

  // Step 1: Setup viem clients
  console.log('📦 Setting up viem clients...');
  const [owner] = Accounts;

  const account = privateKeyToAccount(owner.privKey as `0x${string}`);

  const _walletClient = createWalletClient({
    account,
    chain: localChain,
    transport: http(chainsSupported.local.rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http(chainsSupported.local.rpcUrl),
  });

  // Verify connection
  const blockNumber = await publicClient.getBlockNumber();
  console.log(`✅ Connected to Ganache at block ${blockNumber}\n`);

  // Note: For actual ERC20 deployment, you would need compiled contract bytecode
  // This setup assumes you have a pre-deployed contract or will deploy separately
  const contractAddress =
    process.env.ERC20_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

  if (contractAddress === '0x0000000000000000000000000000000000000000') {
    console.log('⚠️  No ERC20 contract address provided.');
    console.log('   To deploy an ERC20, use Hardhat or Foundry and set ERC20_CONTRACT_ADDRESS');
    console.log('   Example: ERC20_CONTRACT_ADDRESS=0x... bun run setup:ganache\n');
  } else {
    console.log(`📦 Using ERC20 Token at: ${contractAddress}\n`);
  }

  // Step 2: Create ChainCast Program
  console.log('📝 Creating ChainCast Program...');
  const program = [
    {
      name: 'debug',
      args: {
        variablesToDebug: ['event.event', 'event.blockNumber', 'cast.id'],
      },
    },
    {
      name: 'filter-events',
      args: {
        eventName: 'Transfer',
      },
    },
    {
      name: 'debug',
      args: {
        variablesToDebug: [
          'event.returnValues.from',
          'event.returnValues.to',
          'event.returnValues.value',
        ],
      },
    },
  ];

  const programBase64 = Buffer.from(JSON.stringify(program)).toString('base64');
  console.log('✅ ChainCast Program created\n');

  // Step 3: Get ERC20 ABI
  console.log('📋 Preparing ERC20 ABI...');
  const erc20Abi = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
      ],
      name: 'Approval',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
      ],
      name: 'Transfer',
      type: 'event',
    },
  ];
  const abiBase64 = Buffer.from(JSON.stringify(erc20Abi)).toString('base64');
  console.log('✅ ERC20 ABI encoded\n');

  // Step 4: Create ChainCast via API (if contract address is provided)
  if (contractAddress !== '0x0000000000000000000000000000000000000000') {
    console.log('🔗 Creating ChainCast via API...');
    const chainCastUrl = 'http://localhost:4400/api/graphql';

    try {
      await createContractCast(chainCastUrl, {
        address: contractAddress,
        name: 'ERC20 Transfer Monitor',
        chainId: chainsSupported.local.id,
        abi: abiBase64,
        type: 'CUSTOM',
        blockNumber: 0,
        compiledProgram: programBase64,
      });
      console.log('✅ ChainCast created successfully!\n');
    } catch (error) {
      console.error('❌ Failed to create ChainCast:', error);
      console.log('\n📋 Manual Setup Required:');
      console.log(`Contract Address: ${contractAddress}`);
      console.log(`Chain ID: ${chainsSupported.local.id}`);
      console.log(`Program (Base64): ${programBase64}`);
      console.log(`ABI (Base64): ${abiBase64}`);
      console.log(
        '\nUse the GraphQL API at http://localhost:4400/api/graphql ' +
          'to create the ChainCast manually.'
      );
    }
  }

  // Step 5: Save configuration
  console.log('💾 Saving configuration...');
  const config = {
    contractAddress,
    chainId: chainsSupported.local.id,
    program: programBase64,
    abi: abiBase64,
    owner: {
      address: owner.address,
      privateKey: owner.privKey,
    },
    viemConfig: {
      chain: 'local',
      rpcUrl: chainsSupported.local.rpcUrl,
    },
  };

  const configPath = path.join(process.cwd(), 'ganache-setup.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Configuration saved to: ${configPath}\n`);

  console.log('🎉 Setup Complete!');
  console.log('\n📋 Summary:');
  console.log(`- Chain ID: ${chainsSupported.local.id}`);
  console.log(`- Contract Address: ${contractAddress}`);
  console.log('- ChainCast API: http://localhost:4400/api/graphql');
  console.log(`- Ganache RPC: ${chainsSupported.local.rpcUrl}`);
  console.log('\n🚀 Next Steps:');
  console.log('1. Start Ganache: bun run ganache:dev');
  console.log('2. Deploy an ERC20 contract using Hardhat/Foundry');
  console.log('3. Set ERC20_CONTRACT_ADDRESS and run this script again');
  console.log('4. Start ChainCast: bun run dev');
  console.log('5. Transfer tokens to see events being captured');
}

main()
  .then(() => {
    console.log('\n😎 Setup Done 🎉');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  });
