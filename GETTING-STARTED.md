# Getting Started with ChainCast

This guide will walk you through setting up ChainCast with a local Ganache blockchain, deploying an ERC20 token, and creating a program to monitor token transfers.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 8.0.0
- PostgreSQL database
- Git

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd chain-cast

# Install dependencies
npm install
```

## Step 2: Set Up Environment Variables

```bash
# Copy the environment example file
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/chaincast?schema=public

# Logging Configuration
LOG_LEVEL=debug
SILENT=false
LOG_TO_FILE=false

# API Configuration
CHAIN_CAST_API_PORT=4400

# Redis Configuration (optional for development)
REDIS_URL=redis://localhost:6379

# Local Blockchain Configuration
LOCAL_CHAIN_ID=1337
WEB3_RPC_LOCAL_URL=http://127.0.0.1:8545
WEB3_WS_LOCAL_URL=ws://127.0.0.1:8545
```

## Step 3: Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Reset database if needed
npm run db:reset
```

## Step 4: Start Ganache Local Blockchain

```bash
# Start Ganache with predefined accounts and seed
npm run ganache:dev
```

This command starts Ganache with:
- Host: 0.0.0.0
- Port: 8545
- 50 accounts with 100 ETH each
- Deterministic seed for consistent addresses

## Step 5: Deploy ERC20 Token and Create ChainCast (Automated)

In a new terminal window:

```bash
# Deploy ERC20 token and create ChainCast automatically
npm run setup:ganache
```

This script will:
- Deploy a token called "Trolha Token" (TROLHA) with 1,000,000 tokens
- Create a ChainCast program to monitor Transfer events
- Automatically create the ChainCast via the GraphQL API
- Save configuration to `ganache-setup.json`

**Alternative Manual Setup:**

If you prefer to do it manually:

```bash
# Deploy the ERC20 token to Ganache
npm run deploy:local
```

This will deploy a token called "Trolha Token" (TROLHA) with:
- Name: Trolha Token
- Symbol: TROLHA
- Total Supply: 1,000,000 tokens
- Owner: First account from the testing accounts

**Note:** Save the deployed contract address for the next step.

## Step 6: Start ChainCast Service

In another terminal window:

```bash
# Start the ChainCast service
npm run dev
```

The service will be available at `http://localhost:4400/api/graphql`

**Note:** If you used the automated setup, the ChainCast should already be created and listening for events.

## Step 7: Create a ChainCast Program (Manual Setup Only)

If you're doing manual setup, create a program file to monitor ERC20 transfers. Create a file called `erc20-monitor.json`:

```json
[
  {
    "name": "debug",
    "args": {
      "variablesToDebug": ["event.event", "event.blockNumber", "cast.id"]
    }
  },
  {
    "name": "filter-events",
    "args": {
      "eventName": "Transfer"
    }
  },
  {
    "name": "debug",
    "args": {
      "variablesToDebug": ["event.args.from", "event.args.to", "event.args.value"]
    }
  }
]
```

This program will:
1. Debug the incoming event data
2. Filter for only "Transfer" events
3. Debug the transfer details (from, to, value)

**Reference:** See `examples/erc20-monitor.json` for a complete example with webhook integration.

## Step 8: Create ChainCast via API (Manual Setup Only)

If you're doing manual setup, use the GraphQL API to create a contract cast. You can use tools like GraphQL Playground or curl:

```bash
curl -X POST http://localhost:4400/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation createStream($address: String!, $name: String!, $chainId: Int!, $abi: String!, $type: ContractCastType!, $blockNumber: Int!, $program: String!) { createContractCast(data: { address: $address, chainId: $chainId, name: $name, startFrom: $blockNumber, abi: $abi, type: $type, program: $program }) { id } }",
    "variables": {
      "address": "YOUR_DEPLOYED_ERC20_ADDRESS",
      "name": "ERC20 Transfer Monitor",
      "chainId": 1337,
      "blockNumber": 0,
      "abi": "YOUR_ERC20_ABI_BASE64_ENCODED",
      "type": "CUSTOM",
      "program": "W3sibmFtZSI6ImRlYnVnIiwiYXJncyI6eyJ2YXJpYWJsZXNUb0RlYnVnIjpbImV2ZW50LmV2ZW50IiwiZXZlbnQuYmxvY2tOdW1iZXIiLCJjYXN0LmlkIl19fSx7Im5hbWUiOiJmaWx0ZXItZXZlbnRzIiwiYXJncyI6eyJldmVudE5hbWUiOiJUcmFuc2ZlciJ9fSx7Im5hbWUiOiJkZWJ1ZyIsImFyZ3MiOnsidmFyaWFibGVzVG9EZWJ1ZyI6WyJldmVudC5hcmdzLmZyb20iLCJldmVudC5hcmdzLnRvIiwiZXZlbnQuYXJncy52YWx1ZSJdfX1d"
    }
  }'
```

**Important Notes:**
- Replace `YOUR_DEPLOYED_ERC20_ADDRESS` with the actual address from Step 5
- Replace `YOUR_ERC20_ABI_BASE64_ENCODED` with the base64-encoded ERC20 ABI
- The `program` field contains the base64-encoded version of the JSON program from Step 7

## Step 9: Test the Setup

1. **Transfer tokens** using the transfer script:
   ```bash
   npm run transfer:erc20
   ```

2. **Monitor logs** in the ChainCast service terminal to see the transfer events being processed

3. **Check the database** to see the contract cast status:
   ```bash
   npx prisma studio
   ```

4. **View configuration** (if using automated setup):
   ```bash
   cat ganache-setup.json
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check your DATABASE_URL in .env
   - Run `npx prisma migrate deploy`

2. **Ganache Connection Error**
   - Ensure Ganache is running on port 8545
   - Check the ganache:dev script in package.json

3. **Contract Deployment Failed**
   - Ensure Ganache is running
   - Check that the testing accounts have sufficient ETH
   - Verify the chain ID matches (1337)

4. **ChainCast Service Won't Start**
   - Check all environment variables in .env
   - Ensure database migrations are applied
   - Check port 4400 is available

### Useful Commands

```bash
# Reset everything and start fresh
npm run db:reset
npm run ganache:dev

# In another terminal
npm run deploy:local

# In another terminal
npm run dev
```

## Next Steps

- Explore the available instructions in `src/instructions/`
- Create more complex programs with multiple instructions
- Add webhook notifications for transfers
- Implement data transformation and filtering
- Set up monitoring and alerting

## API Reference

The ChainCast GraphQL API provides the following main operations:

- `createContractCast`: Create a new contract cast
- `deleteContractCast`: Delete an existing contract cast
- `contractCast`: Query a specific contract cast
- `contractCasts`: List all contract casts

For more information, visit the GraphQL playground at `http://localhost:4400/api/graphql` when the service is running.
