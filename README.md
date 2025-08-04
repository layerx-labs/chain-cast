# Chain Cast

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/layerx-labs/chain-cast/workflows/ChainCast%20API%20CI/badge.svg)](https://github.com/layerx-labs/chain-cast/actions)
[![npm version](https://badge.fury.io/js/chain-cast.svg)](https://badge.fury.io/js/chain-cast)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> A powerful open-source tool designed to listen to and recover events from smart contracts deployed on various blockchain platforms. By seamlessly integrating with blockchain networks, Chain Cast provides developers and businesses with the ability to extract and process valuable event data in a reliable and efficient manner.

**🏛️ DAO-Governed Project**: Chain Cast is controlled and managed by $CHAIN token holders through the CHAINCAST DAO. All commercial licenses and governance decisions are made by the DAO community.

## 🌟 Features

### Event Listening and Recovery
- **Real-time Event Monitoring**: Establishes connections with smart contracts and monitors their event logs in real-time
- **Automatic Recovery**: Automatically recovers missed events during network interruptions or downtime
- **Robust Data Flow**: Ensures uninterrupted data flow with comprehensive error handling

### Programmable Event Processing Pipeline
- **Customizable Processing**: Define customized event processing pipelines tailored to your specific needs
- **Flexible Configuration**: Programmable configurations for defining sequences of processors and actions
- **Extensible Framework**: Support for data transformation, filtering, enrichment, aggregation, and custom operations

### Extensible Instructions Architecture
Chain Cast's virtual machine is built around a modular instructions architecture that allows for easy extension and customization:

#### Core Instruction Types
- **Data Transformations**: String manipulation, number formatting, object restructuring, array operations
- **Conditional Logic**: Complex filtering and branching based on event data
- **External Integrations**: Webhooks, message queues, databases, analytics platforms
- **Data Processing**: Aggregation, enrichment, validation, and custom business logic

#### Built-in Instructions
- **`transform-string`**: Text manipulation (capitalize, lowercase, camelize, etc.)
- **`transform-number`**: Numeric operations and formatting
- **`transform-object`**: Object restructuring and field mapping
- **`transform-array`**: Array operations and filtering
- **`transform-template`**: Template-based data transformation
- **`condition`**: Conditional logic and branching
- **`filter-events`**: Event filtering based on criteria
- **`webhook`**: HTTP webhook integration
- **`bullmq`**: Message queue integration
- **`elastic-search`**: Elasticsearch data indexing
- **`spreadsheet`**: Google Sheets integration
- **`debug`**: Development and debugging utilities

#### Custom Instruction Development
The instruction system is designed for extensibility:

```typescript
export class CustomInstruction implements Instruction {
  INSTRUCTION_NAME = 'custom-instruction';

  validateArgs(args: InstructionArgs): boolean {
    // Validate input arguments using Zod schemas
    return true;
  }

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema(): typeof ArgsTypeSchema {
    return ArgsTypeSchema;
  }

  async onAction(vm: VirtualMachine): Promise<void> {
    // Implement custom processing logic
    // Access event data via vm.getGlobalVariable('event')
    // Access cast configuration via vm.getGlobalVariable('cast')
  }
}
```

#### Integration Capabilities
- **External APIs**: Connect to any REST API or GraphQL endpoint
- **Message Queues**: Integrate with Redis, RabbitMQ, Apache Kafka
- **Databases**: Direct database operations and data persistence
- **Analytics**: Send data to analytics platforms and monitoring systems
- **Notifications**: Real-time alerts and notifications
- **Custom Logic**: Implement any business logic or data processing

### Seamless Integration
- **External System Integration**: Forward processed events to databases, message queues, analytics platforms, or any desired destinations
- **Real-time Notifications**: Create real-time notifications and triggers for downstream actions
- **Analytics Support**: Generate reports and drive decision-making processes

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.0.0 or above
- **PostgreSQL**: Local database recommended for development
- **Redis**: For queue management (optional for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/layerx-labs/chain-cast.git
   cd chain-cast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```

   Configure your `.env.local` file:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/chaincast?schema=public
   LOG_LEVEL=debug
   SILENT=false
   LOG_TO_FILE=false
   CHAIN_CAST_API_PORT=4400
   ```

4. **Initialize the database**
   ```bash
   npm run db:reset
   ```

5. **Start the development environment**
   ```bash
   npm run dev
   ```

   This will start:
   - API server
   - Redis (if configured)
   - Queue worker

## 🛠️ Supported Contract Types

- **NetworkV2**: Advanced network contracts
- **Network Registry**: Registry management contracts
- **Bounty Token**: Token-based bounty systems
- **ERC1155**: Multi-token standard
- **ERC20**: Fungible token standard
- **ERC721**: Non-fungible token standard

## 📚 Documentation

- [API Documentation](./doc/README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [DAO Governance](./GOVERNANCE.md)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Debug tests
npm run test:debug
```

## 🏗️ Development

### Available Scripts

- `npm run dev`: Start application in development mode
- `npm run dev:debug`: Start application with debug mode
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run pretty`: Check code against prettier standards
- `npm run prettier`: Format code with prettier
- `npm run lint`: Run ESLint on the code
- `npm run lint:fix`: Fix ESLint issues automatically

### Technology Stack

- **Prisma 4**: ORM for database interactions
- **PostgreSQL**: Primary database
- **GraphQL Yoga**: GraphQL server
- **ESLint + Prettier**: Code quality and formatting
- **Jest**: Testing framework with coverage
- **TypeScript**: Type-safe JavaScript

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License for open source use. **Commercial licenses are governed by the CHAINCAST DAO**. For commercial use, please contact the DAO governance at chaincast@layerx.xyz.

### License Types

- **MIT License**: For open source and non-commercial use
- **Commercial License**: Governed by CHAINCAST DAO - requires DAO approval
- **Enterprise License**: Available through DAO governance

See the [LICENSE](./LICENSE) file for details.

## 🏛️ DAO Governance

Chain Cast is governed by the CHAINCAST DAO, where $CHAIN token holders make key decisions about:

- **Commercial Licensing**: All commercial license approvals
- **Feature Development**: Major feature roadmap decisions
- **Partnerships**: Strategic partnerships and integrations
- **Treasury Management**: Project funding and resource allocation
- **Governance Updates**: Changes to governance structure

### Getting Involved

- **Join the DAO**: Acquire $CHAIN tokens to participate in governance
- **Propose Changes**: Submit governance proposals for community voting
- **Vote on Proposals**: Participate in DAO voting on key decisions
- **Contribute**: Help build and improve the project

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/layerx-labs/chain-cast/issues)
- **Discussions**: [GitHub Discussions](https://github.com/layerx-labs/chain-cast/discussions)
- **DAO Contact**: chaincast@layerx.xyz

## 🙏 Acknowledgments

- Built with ❤️ by the LayerX Labs team
- Governed by the CHAINCAST DAO community
- Thanks to all our [contributors](https://github.com/layerx-labs/chain-cast/graphs/contributors)

---

**Made with ❤️ by [LayerX Labs](https://github.com/layerx-labs) | Governed by [CHAINCAST DAO](https://dao.chaincast.xyz)**
