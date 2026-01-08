# CLAUDE.md - Chain Cast Development Guide

This document provides a comprehensive guide for AI assistants working on the Chain Cast codebase.

## Project Overview

**Chain Cast** is a DAO-governed blockchain event processing platform designed to listen, process, and stream events from smart contracts deployed on various EVM blockchain networks.

- **Repository**: https://github.com/layerx-labs/chain-cast
- **License**: MIT (open source) / Commercial licenses governed by CHAINCAST DAO
- **Runtime**: Bun (fast JavaScript runtime with native TypeScript support)
- **Main Branch**: `master`
- **Current Branch**: `hcv_migration_to_bun`

## Core Technology Stack

- **Runtime**: Bun 1.0.0+ (replaces Node.js for better performance)
- **Language**: TypeScript 5.0.4
- **Database**: PostgreSQL with Prisma 4 ORM
- **Blockchain**: viem for Ethereum interactions (TypeScript-first, high performance)
- **API**: GraphQL Yoga with Pothos schema builder
- **Queue**: BullMQ with Redis
- **Search**: Elasticsearch 8
- **Testing**: Bun's built-in test framework
- **Linting**: Biome (linting and formatting)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GraphQL API Server                       │
│                  (Express + GraphQL Yoga)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    ChainCast Manager                         │
│        (Orchestrates contract listeners)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌────────▼────────┐
│ Contract       │  │ Contract     │  │ Contract        │
│ Listener 1     │  │ Listener 2   │  │ Listener N      │
└────────┬───────┘  └──────┬───────┘  └────────┬────────┘
         │                 │                    │
         └─────────────────┼────────────────────┘
                           │
                ┌──────────▼──────────┐
                │  Event Retriever    │
                │  (viem Client)      │
                └──────────┬──────────┘
                           │
                ┌──────────▼──────────┐
                │   Virtual Machine   │
                │  (Instruction VM)   │
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────┐  ┌──────────▼─────┐  ┌────────▼────────┐
│ Webhook    │  │ BullMQ Queue   │  │ Elasticsearch   │
└────────────┘  └────────────────┘  └─────────────────┘
```

### Core Components

#### 1. ChainCast Manager (`src/services/chaincast-manager.ts`)
- Orchestrates all contract listeners
- Manages listener lifecycle (start, stop, reload)
- Loads ChainCast configurations from database

#### 2. Contract Listener (`src/lib/contract-listener.ts`)
- Listens to specific smart contract events
- Handles event recovery and synchronization
- Delegates event processing to Virtual Machine

#### 3. Virtual Machine (`src/lib/vm.ts`)
- Executes instruction pipelines
- Maintains global and local variable scopes
- Processes events through instruction sequences

#### 4. Instructions (`src/instructions/`)
Modular instruction system for event processing:

- **Transform Instructions**:
  - `transform-string.ts` - String manipulation
  - `transform-number.ts` - Numeric operations
  - `transform-object.ts` - Object restructuring
  - `transform-array.ts` - Array operations
  - `transform-template.ts` - Template-based transformations

- **Logic Instructions**:
  - `condition.ts` - Conditional branching
  - `filter-events.ts` - Event filtering

- **Integration Instructions**:
  - `webhook.ts` - HTTP webhooks
  - `bullmq.ts` - Message queue integration
  - `elastic-search.ts` - Elasticsearch indexing
  - `spreadsheet.ts` - Google Sheets integration

- **Utility Instructions**:
  - `set.ts` - Variable assignment
  - `debug.ts` - Debugging and logging

#### 5. Event Retriever (`src/lib/contract-event-retriever.ts`)
- Fetches historical events from blockchain
- Manages block range queries
- Handles RPC rate limiting and retries

#### 6. GraphQL API (`src/graphql/`)
- **Schema**: Pothos-based schema builder
- **Queries**: Contract Cast queries
- **Mutations**: Create, update, delete operations
- **Types**: GraphQL type definitions

## Directory Structure

```
chain-cast/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── config/                    # Configuration management
│   ├── constants/                 # Chain constants and configs
│   ├── context.ts                 # GraphQL context
│   ├── graphql/                   # GraphQL API layer
│   │   ├── builder.ts            # Pothos schema builder
│   │   ├── schema.ts             # Schema definition
│   │   ├── query/                # Query resolvers
│   │   ├── mutation/             # Mutation resolvers
│   │   ├── resolvers/            # Resolver implementations
│   │   └── types/                # GraphQL types
│   ├── instructions/              # VM instruction implementations
│   ├── lib/                       # Core business logic
│   │   ├── api.ts                # API utilities
│   │   ├── contract-listener.ts  # Event listener
│   │   ├── contract-listener-factory.ts
│   │   ├── contract-event-retriever.ts
│   │   ├── contract-cast.ts      # Cast management
│   │   ├── model-factory.ts      # Model utilities
│   │   ├── program.ts            # Program execution
│   │   ├── stack.ts              # Stack data structure
│   │   ├── time.ts               # Time utilities
│   │   └── vm.ts                 # Virtual Machine
│   ├── middleware/                # Express middleware
│   ├── services/                  # Core services
│   │   ├── chaincast-manager.ts  # Manager service
│   │   ├── log.ts                # Logging service
│   │   ├── prisma.ts             # Prisma client
│   │   └── secret-manager.ts     # Secret management
│   ├── types/                     # TypeScript type definitions
│   └── util/                      # Utility functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── scripts/                       # Utility scripts
├── doc/                          # Documentation
├── .env.local                    # Local environment config
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Key Concepts

### ChainCast

A **ChainCast** is a programmable event processing pipeline that:
1. Monitors a specific smart contract for events
2. Recovers historical events when needed
3. Processes events through an instruction pipeline
4. Sends processed data to external systems

### Instructions

Instructions are modular processing units that:
- Receive event data and context
- Perform specific operations (transform, filter, send, etc.)
- Update VM state (global/local variables)
- Can be chained together in sequences

### Virtual Machine (VM)

The VM executes instruction pipelines:
- **Global Variables**: Shared across all instructions (e.g., `event`, `cast`)
- **Local Variables**: Scoped to instruction execution
- **Stack**: Stores intermediate computation results
- **Program**: Sequence of instructions to execute

### Event Recovery

ChainCast automatically recovers missed events:
1. Tracks last processed block number
2. On restart, queries blockchain for missed events
3. Processes historical events before resuming real-time listening

## Development Workflow

### Environment Setup

1. **Install Bun**:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Clone and Install**:
   ```bash
   git clone https://github.com/layerx-labs/chain-cast.git
   cd chain-cast
   bun install
   ```

3. **Configure Environment**:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**:
   ```bash
   bunx prisma migrate reset  # Reset and seed database
   bunx prisma migrate dev    # Apply new migrations
   bunx prisma db push        # Push schema changes (dev only)
   ```

### Available Scripts

- `bun run dev` - Development mode with hot reload
- `bun run dev:debug` - Debug mode (inspector on port 4321)
- `bun run start` - Production server
- `bun run build` - Install deps and generate Prisma client
- `bun test` - Run tests
- `bun test --coverage` - Run tests with coverage
- `bun run lint` - Lint code with Biome
- `bun run lint:fix` - Fix linting issues with Biome
- `bun run format` - Format code with Biome
- `bun run check` - Run all Biome checks (lint + format)
- `bun run check:fix` - Fix all Biome issues

### Local Development

For local blockchain testing (Hardhat, Anvil, or similar):

1. **Start your local blockchain** (e.g., Anvil):
   ```bash
   anvil
   ```

2. **Configure local chain** in `.env.local`:
   ```env
   LOCAL_CHAIN_ID=31337
   WEB3_RPC_LOCAL_URL=http://127.0.0.1:8545
   WEB3_WS_LOCAL_URL=ws://127.0.0.1:8545
   ```

3. **Start ChainCast**:
   ```bash
   bun run dev
   ```

4. **API Available at**: http://localhost:4400/api/graphql

## Database Schema

Key Prisma models:

### ContractCast
- `id`: Unique identifier
- `name`: ChainCast name
- `description`: Description
- `chainId`: Blockchain chain ID
- `contractAddress`: Smart contract address
- `abi`: Contract ABI (JSON)
- `eventNames`: Events to monitor
- `program`: Instruction pipeline (JSON)
- `fromBlock`: Starting block number
- `toBlock`: Ending block number (optional)
- `enabled`: Enable/disable flag
- `lastProcessedBlock`: Last processed block

### Secret
- `id`: Secret identifier
- `key`: Secret key name
- `value`: Encrypted secret value
- `contractCastId`: Associated ChainCast (optional)

### EventLog
- Stores processed events for auditing

## Testing

### Test Structure

```typescript
import { describe, it, expect } from 'bun:test';

describe('Component Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/lib/vm.test.ts

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

## Creating New Instructions

To create a custom instruction:

1. **Create file**: `src/instructions/my-instruction.ts`

```typescript
import { Instruction, InstructionArgs } from '@/types/vm';
import { VirtualMachine } from '@/lib/vm';
import { z } from 'zod';

// Define argument schema
const ArgsSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});

export class MyInstruction implements Instruction {
  INSTRUCTION_NAME = 'my-instruction';

  validateArgs(args: InstructionArgs): boolean {
    try {
      ArgsSchema.parse(args);
      return true;
    } catch {
      return false;
    }
  }

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return ArgsSchema;
  }

  async onAction(vm: VirtualMachine): Promise<void> {
    // Get current instruction args
    const args = ArgsSchema.parse(vm.getCurrentInstruction()?.args);

    // Access global variables
    const event = vm.getGlobalVariable('event');
    const cast = vm.getGlobalVariable('cast');

    // Perform operations
    const result = await this.doSomething(args.param1);

    // Set variables
    vm.setGlobalVariable('result', result);

    // Or use local variables
    vm.setLocalVariable('temp', result);
  }

  private async doSomething(param: string): Promise<any> {
    // Implementation
  }
}
```

2. **Register instruction** in `src/main.ts`:

```typescript
import { MyInstruction } from './instructions/my-instruction';

// In the run() function:
manager.registerInstruction(new MyInstruction());
```

## Common Tasks

### Adding a New ChainCast via GraphQL

```graphql
mutation CreateChainCast {
  createContractCast(input: {
    name: "My ChainCast"
    description: "Monitor ERC20 transfers"
    chainId: 1
    contractAddress: "0x..."
    abi: "[...]"
    eventNames: ["Transfer"]
    program: {
      instructions: [
        {
          name: "debug"
          args: { message: "Processing transfer event" }
        },
        {
          name: "webhook"
          args: {
            url: "https://example.com/webhook"
            method: "POST"
          }
        }
      ]
    }
    fromBlock: "latest"
    enabled: true
  }) {
    id
    name
    enabled
  }
}
```

### Updating Database Schema

1. Modify `prisma/schema.prisma`
2. Create migration:
   ```bash
   bunx prisma migrate dev --name description_of_change
   ```
3. Apply migration:
   ```bash
   bunx prisma migrate deploy
   ```

### Adding New Chain Support

1. Add chain config to `src/constants/chains.ts`:

```typescript
export const CHAIN_CONFIGS = {
  // Existing chains...
  myChain: {
    chainId: 12345,
    name: 'My Chain',
    rpcUrl: 'https://rpc.mychain.com',
    explorer: 'https://explorer.mychain.com',
  },
};
```

## Debugging

### Enable Debug Logging

Set in `.env.local`:
```env
LOG_LEVEL=debug
LOG_TO_FILE=true
```

### Use Debug Instruction

Add debug instruction to your pipeline:
```json
{
  "name": "debug",
  "args": {
    "message": "Current event data",
    "data": "${event}"
  }
}
```

### Inspect Mode

Run with Bun inspector:
```bash
bun run dev:debug
```

Then connect Chrome DevTools to `localhost:4321`.

## Security Considerations

1. **Secrets Management**:
   - Never commit `.env.local` or secrets
   - Use Secret Manager for API keys
   - Secrets are encrypted at rest

2. **Input Validation**:
   - All instruction args validated with Zod schemas
   - Contract addresses validated
   - ABI parsing errors handled

3. **Rate Limiting**:
   - RPC providers may rate limit
   - Use delays between batch requests
   - Handle retries gracefully

4. **Error Handling**:
   - All async operations wrapped in try-catch
   - Graceful degradation on failures
   - Detailed error logging

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Set up Redis for BullMQ
- [ ] Configure Elasticsearch (if used)
- [ ] Set appropriate `LOG_LEVEL`
- [ ] Enable SSL/TLS for API
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Test secret encryption/decryption
- [ ] Review rate limiting settings

### Environment Variables

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `SILENT` - Suppress console output (true/false)
- `LOG_TO_FILE` - Write logs to file (true/false)
- `CHAIN_CAST_API_PORT` - API server port (default: 4400)
- `NODE_ENV` - Environment (development/production)

## DAO Governance

Chain Cast is governed by the CHAINCAST DAO:
- Commercial licenses require DAO approval
- Major features voted by $CAST token holders
- Community-driven development
- Contact: chaincast@layerx.xyz

## Troubleshooting

### Common Issues

**Issue**: Database connection fails
- Solution: Check `DATABASE_URL` in `.env.local`
- Run: `bunx prisma db push` to sync schema

**Issue**: RPC provider errors
- Solution: Check RPC endpoint availability
- Consider using alternative RPC provider
- Check rate limiting

**Issue**: Events not processing
- Solution: Check ChainCast is enabled
- Verify contract address and ABI
- Check logs for errors
- Ensure blockchain node is synced

**Issue**: Instruction validation fails
- Solution: Check instruction args against schema
- Review instruction documentation
- Enable debug logging

## Resources

- [README.md](./README.md) - Project overview
- [GETTING-STARTED.md](./GETTING-STARTED.md) - Quick start guide
- [API Documentation](./doc/README.md) - API reference
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [GitHub Issues](https://github.com/layerx-labs/chain-cast/issues)
- [Bun Documentation](https://bun.sh/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [viem Documentation](https://viem.sh/)
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)
- [Biome Documentation](https://biomejs.dev/)

## Code Style

- **TypeScript**: Strict mode enabled
- **Biome**: Linting and formatting (replaces ESLint + Prettier)
  - 2 spaces indentation
  - Single quotes
  - Trailing commas (ES5 style)
  - Line width: 100 characters
- **Imports**: Use `@/` alias for `src/`, auto-organized by Biome
- **Naming**:
  - Classes: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case

## Contributing

When contributing code:
1. Fork the repository
2. Create feature branch from `master`
3. Write tests for new features
4. Ensure all tests pass
5. Run linting and formatting
6. Submit PR with clear description
7. Reference related issues

---

**Last Updated**: 2026-01-07
**Maintained by**: LayerX Labs & CHAINCAST DAO Community
