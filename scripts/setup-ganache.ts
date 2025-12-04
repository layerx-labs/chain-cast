import { chainsSupported } from '@/constants/chains';
import Accounts from './accounts-testing';
import { ERC20, Web3Connection } from '@taikai/dappkit';
import { createContractCast } from '@/lib/api';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 Starting ChainCast Ganache Setup...\n');

  // Step 1: Deploy ERC20 Token
  console.log('📦 Deploying ERC20 Token...');
  const TOKEN_NAME = 'Trolha Token';
  const TOKEN_SYMBOL = 'TROLHA';
  const TOKEN_SUPPLY = 1000000;
  const [owner] = Accounts;

  const web3con = new Web3Connection({
    debug: false,
    web3Host: chainsSupported.local.rpcUrl,
    privateKey: owner.privKey,
  });

  const erc20Deployer = new ERC20(web3con);
  const tx = await erc20Deployer.deployJsonAbi(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_SUPPLY.toString().concat('000000000000000000'),
    owner.address
  );

  const contractAddress = tx.contractAddress;
  console.log(`✅ ERC20 Token deployed to: ${contractAddress}\n`);

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
        variablesToDebug: ['event.args.from', 'event.args.to', 'event.args.value'],
      },
    },
  ];

  const programBase64 = Buffer.from(JSON.stringify(program)).toString('base64');
  console.log('✅ ChainCast Program created\n');

  // Step 3: Get ERC20 ABI
  console.log('📋 Getting ERC20 ABI...');
  // Use a standard ERC20 ABI since getAbi() might not be available
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

  // Step 4: Create ChainCast via API
  console.log('🔗 Creating ChainCast via API...');
  const chainCastUrl = 'http://localhost:4400/api/graphql';

  try {
    await createContractCast(chainCastUrl, {
      address: contractAddress,
      name: 'ERC20 Transfer Monitor',
      chainId: 1337,
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
    console.log(`Chain ID: 1337`);
    console.log(`Program (Base64): ${programBase64}`);
    console.log(`ABI (Base64): ${abiBase64}`);
    console.log(
      '\nUse the GraphQL API at http://localhost:4400/api/graphql ' +
        'to create the ChainCast manually.'
    );
  }

  // Step 5: Save configuration
  console.log('💾 Saving configuration...');
  const config = {
    contractAddress,
    chainId: 1337,
    program: programBase64,
    abi: abiBase64,
    owner: {
      address: owner.address,
      privateKey: owner.privKey,
    },
  };

  const configPath = path.join(process.cwd(), 'ganache-setup.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Configuration saved to: ${configPath}\n`);

  console.log('🎉 Setup Complete!');
  console.log('\n📋 Summary:');
  console.log(`- ERC20 Token: ${contractAddress}`);
  console.log(`- ChainCast API: http://localhost:4400/api/graphql`);
  console.log(`- Ganache RPC: http://127.0.0.1:8545`);
  console.log('\n🚀 Next Steps:');
  console.log('1. Start Ganache: npm run ganache:dev');
  console.log('2. Start ChainCast: npm run dev');
  console.log('3. Transfer tokens: npm run transfer:erc20');
  console.log('4. Monitor logs for transfer events');
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
