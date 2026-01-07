# Getting Started with ChainCast

This guide walks you through setting up ChainCast to monitor **$LX token transfers on Ethereum mainnet**. By the end, you'll have a working pipeline that captures real-time transfer events from a production blockchain.

## What You'll Build

You'll create a Contract Cast that:
- Connects to Ethereum mainnet via Alchemy RPC
- Monitors the $LX token contract for Transfer events
- Processes and logs transfer details (from, to, value)

## Prerequisites

- **Bun**: >= 1.0.0 ([Install Bun](https://bun.sh/docs/installation))
- **PostgreSQL**: Running database instance
- **Alchemy Account**: Free tier works ([Sign up](https://www.alchemy.com/))
- **Git**: For cloning the repository

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/layerx-labs/chain-cast.git
cd chain-cast

# Install dependencies
bun install
```

## Step 2: Set Up Environment Variables

```bash
# Copy the environment example file
cp env.example .env.local
```

Edit the `.env.local` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/chaincast?schema=public

# Logging Configuration
LOG_LEVEL=debug
SILENT=false
LOG_TO_FILE=false

# API Configuration
CHAIN_CAST_API_PORT=4400
# Make sur your api key supports this
BLOCKS_PER_CALL=1000

# Ethereum Mainnet RPC (Alchemy)
# Get your API key from https://dashboard.alchemy.com/
WEB3_RPC_ETH_MAIN_NET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
WEB3_WS_ETH_MAIN_NET_URL=wss://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
```

Replace `YOUR_ALCHEMY_API_KEY` with your actual Alchemy API key.

## Step 3: Set Up Database

```bash
# Generate Prisma client
bunx prisma generate

# Run database migrations
bunx prisma migrate deploy

# (Optional) Reset database if needed
bun run db:reset
```

## Step 4: Create a Contract Cast Program

Create a program file to monitor $LX token transfers. Create a file called `examples/lx-token-monitor.json`:

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
1. Log the incoming event type and block number
2. Filter for only "Transfer" events
3. Log the transfer details (sender, recipient, amount)

## Step 5: Start ChainCast Service

```bash
# Start the ChainCast service
bun run dev
```

The service will be available at `http://localhost:4400/api/graphql`

## Step 6: Create Contract Cast via GraphQL API

Use the GraphQL API to create a contract cast for the $LX token. You can use the GraphQL Playground at `http://localhost:4400/api/graphql` or curl:

### Using GraphQL Playground

Navigate to `http://localhost:4400/api/graphql` and run:

```graphql
mutation createLXMonitor {
  createContractCast(data: {
    address: "0xcf3c8be2e2c42331da80ef210e9b1b307c03d36a"
    name: "LX Token Transfer Monitor"
    chainId: 1
    startFrom: 10950415
    abi: "W3siYW5vbnltb3VzIjpmYWxzZSwiaW5wdXRzIjpbeyJpbmRleGVkIjp0cnVlLCJpbnRlcm5hbFR5cGUiOiJhZGRyZXNzIiwibmFtZSI6ImZyb20iLCJ0eXBlIjoiYWRkcmVzcyJ9LHsiaW5kZXhlZCI6dHJ1ZSwiaW50ZXJuYWxUeXBlIjoiYWRkcmVzcyIsIm5hbWUiOiJ0byIsInR5cGUiOiJhZGRyZXNzIn0seyJpbmRleGVkIjpmYWxzZSwiaW50ZXJuYWxUeXBlIjoidWludDI1NiIsIm5hbWUiOiJ2YWx1ZSIsInR5cGUiOiJ1aW50MjU2In1dLCJuYW1lIjoiVHJhbnNmZXIiLCJ0eXBlIjoiZXZlbnQifV0="
    type: CUSTOM
    program: "W3sibmFtZSI6ImRlYnVnIiwiYXJncyI6eyJ2YXJpYWJsZXNUb0RlYnVnIjpbImV2ZW50LmV2ZW50IiwiZXZlbnQuYmxvY2tOdW1iZXIiLCJjYXN0LmlkIl19fSx7Im5hbWUiOiJmaWx0ZXItZXZlbnRzIiwiYXJncyI6eyJldmVudE5hbWUiOiJUcmFuc2ZlciJ9fSx7Im5hbWUiOiJkZWJ1ZyIsImFyZ3MiOnsidmFyaWFibGVzVG9EZWJ1ZyI6WyJldmVudC5hcmdzLmZyb20iLCJldmVudC5hcmdzLnRvIiwiZXZlbnQuYXJncy52YWx1ZSJdfX1d"
  }) {
    id
    name
    status
  }
}
```

### Using curl

```bash
curl -X POST http://localhost:4400/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation createStream($address: String!, $name: String!, $chainId: Int!, $abi: String!, $type: ContractCastType!, $blockNumber: Int!, $program: String!) { createContractCast(data: { address: $address, chainId: $chainId, name: $name, startFrom: $blockNumber, abi: $abi, type: $type, program: $program }) { id name status } }",
    "variables": {
      "address": "0xcf3c8be2e2c42331da80ef210e9b1b307c03d36a",
      "name": "LX Token Transfer Monitor",
      "chainId": 1,
      "blockNumber": 10950415,
      "abi": "W3siYW5vbnltb3VzIjpmYWxzZSwiaW5wdXRzIjpbeyJpbmRleGVkIjp0cnVlLCJpbnRlcm5hbFR5cGUiOiJhZGRyZXNzIiwibmFtZSI6ImZyb20iLCJ0eXBlIjoiYWRkcmVzcyJ9LHsiaW5kZXhlZCI6dHJ1ZSwiaW50ZXJuYWxUeXBlIjoiYWRkcmVzcyIsIm5hbWUiOiJ0byIsInR5cGUiOiJhZGRyZXNzIn0seyJpbmRleGVkIjpmYWxzZSwiaW50ZXJuYWxUeXBlIjoidWludDI1NiIsIm5hbWUiOiJ2YWx1ZSIsInR5cGUiOiJ1aW50MjU2In1dLCJuYW1lIjoiVHJhbnNmZXIiLCJ0eXBlIjoiZXZlbnQifV0=",
      "type": "CUSTOM",
      "program": "W3sibmFtZSI6ImRlYnVnIiwiYXJncyI6eyJ2YXJpYWJsZXNUb0RlYnVnIjpbImV2ZW50LmV2ZW50IiwiZXZlbnQuYmxvY2tOdW1iZXIiLCJjYXN0LmlkIl19fSx7Im5hbWUiOiJmaWx0ZXItZXZlbnRzIiwiYXJncyI6eyJldmVudE5hbWUiOiJUcmFuc2ZlciJ9fSx7Im5hbWUiOiJkZWJ1ZyIsImFyZ3MiOnsidmFyaWFibGVzVG9EZWJ1ZyI6WyJldmVudC5hcmdzLmZyb20iLCJldmVudC5hcmdzLnRvIiwiZXZlbnQuYXJncy52YWx1ZSJdfX1d"
    }
  }'
```

**Note:** The `abi` and `program` fields are base64-encoded. The ABI contains the ERC20 Transfer event signature, and the program contains the processing instructions from Step 4.

## Step 7: Monitor Live Transfers

Once the Contract Cast is created, it will:
1. Start recovering historical Transfer events from the $LX token contract
2. Begin listening for new Transfer events in real-time
3. Process each event through your program pipeline
4. Output debug logs showing transfer details

Check the ChainCast service terminal to see the transfer events being processed:

```
[DEBUG] event.event: Transfer
[DEBUG] event.blockNumber: 19234567
[DEBUG] event.args.from: 0x1234...
[DEBUG] event.args.to: 0x5678...
[DEBUG] event.args.value: 1000000000000000000
```

## Step 8: Query the Contract Cast Status

Check the status of your Contract Cast using the GraphQL API:

```graphql
query getChainCasts {
  contractCasts {
    id
    name
    status
    chainId
    lastBlock
    address
  }
}
```

## About the $LX Token

- **Contract Address**: `0xcf3c8be2e2c42331da80ef210e9b1b307c03d36a`
- **Chain**: Ethereum Mainnet (Chain ID: 1)
- **Token**: LayerX Token ($LX)
- **View on Etherscan**: [LX Token Contract](https://etherscan.io/token/0xcf3c8be2e2c42331da80ef210e9b1b307c03d36a)

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check your `DATABASE_URL` in `.env.local`
   - Run `bunx prisma migrate deploy`

2. **RPC Connection Error**
   - Verify your Alchemy API key is correct
   - Ensure you're using the Ethereum mainnet endpoints
   - Check Alchemy dashboard for rate limits

3. **No Events Appearing**
   - The $LX token may have low transfer activity
   - Set `startFrom: 10950415` to recover historical events
   - Check logs for any error messages

4. **ChainCast Service Won't Start**
   - Check all environment variables in `.env.local`
   - Ensure database migrations are applied
   - Check port 4400 is available

### Viewing Logs

For more detailed logging:
```bash
# Set debug logging in .env.local
LOG_LEVEL=debug
```

### Database Inspection

Use Prisma Studio to inspect the database:
```bash
bunx prisma studio
```

## Next Steps

Now that you have ChainCast monitoring $LX transfers, you can:

- **Add Webhook Notifications**: Send transfer data to external services
  ```json
  {
    "name": "webhook",
    "args": {
      "url": "https://your-api.com/webhook",
      "method": "POST",
      "body": "event"
    }
  }
  ```

- **Write Custom Pipelines with YAML**: Use the DSL compiler for more complex logic
  ```bash
  bun run castc compile my-pipeline.yaml --base64
  ```

- **Monitor Multiple Contracts**: Create additional Contract Casts for other tokens or contracts

- **Explore the Instructions**: See `src/instructions/` for all available processing instructions

## Additional Resources

- [DSL Programming Guide](./doc/DSL-GUIDE.md) - Write custom event processing pipelines
- [API Documentation](./doc/README.md) - Full GraphQL API reference
- [Examples](./examples/) - Sample programs and configurations
- [GitHub Issues](https://github.com/layerx-labs/chain-cast/issues) - Report bugs or request features
