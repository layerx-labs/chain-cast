# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-01-07

### Added
- Comprehensive unit test suite with 80%+ coverage
  - VM and instruction tests
  - GraphQL resolver tests
  - Service layer tests (ChainCast Manager, Secret Manager)
  - Utility function tests
- Test mocks for external services (Prisma, viem, logging)
- Test fixtures for casts, events, and programs
- New `viem-client.ts` module for blockchain interactions
- Object utility helpers in `src/lib/object.ts`
- Webhook integration for swap events (TKAI-BEPRO to Zapier)
- CLAUDE.md development guide for AI assistants
- Governance presentation documentation

### Changed
- **Runtime Migration**: Migrated from Node.js to Bun for improved performance
  - Replaced `ts-node-dev` with `bun --watch`
  - Updated all scripts to use Bun runtime
  - Replaced Jest with Bun's built-in test framework
- **Blockchain Library**: Replaced ethers.js and @taikai/dappkit with viem
  - TypeScript-first approach with better type safety
  - Improved performance and smaller bundle size
  - Updated Contract Event Retriever to use viem clients
  - Updated Contract Listener to use viem
- **Linting/Formatting**: Migrated from ESLint + Prettier to Biome
  - Single configuration file (`biome.json`)
  - 10-100x faster linting and formatting
  - Auto-organized imports
  - Removed 14 ESLint/Prettier dependencies
- **CI/CD**: Upgraded GitHub Actions
  - Updated `setup-bun` to v2
  - Updated `codecov-action` to v5
  - Renamed workflow from `node.js.yml` to `ci-cd.yml`
- Improved TypeScript configuration with stricter settings
- Enhanced error handling with proper type annotations
- Refactored logging service for better modularity

### Removed
- Node.js-specific dependencies (ts-node, ts-node-dev, tsconfig-paths)
- ESLint and Prettier configuration files and dependencies
- Jest configuration and dependencies
- `contract-listener-factory.ts` (consolidated into contract-listener)
- `model-factory.ts` (no longer needed)
- `@taikai/dappkit` dependency
- `package-lock.json` (replaced with `bun.lock`)

### Fixed
- TypeScript catch clause type annotations (`catch (e: unknown)`)
- Biome lint errors across entire codebase
- CI pipeline compatibility issues

## [1.1.1] - 2024-11-04

### Added
- Comprehensive open source documentation
  - `CONTRIBUTING.md` with detailed contribution guidelines
  - `CODE_OF_CONDUCT.md` for community standards
  - `SECURITY.md` with vulnerability reporting guidelines
  - `GOVERNANCE.md` outlining DAO governance structure
  - `ROADMAP.md` with project milestones
  - `GETTING-STARTED.md` quick start guide
- GitHub issue and PR templates
  - Bug report template
  - Feature request template
  - Question template
  - Pull request template
- ERC20 monitor example configuration (`examples/erc20-monitor.json`)
- Ganache setup script for local development (`scripts/setup-ganache.ts`)
- Environment configuration example (`env.example`)
- Expanded API documentation in `doc/README.md`
- Code documentation for core library modules

### Changed
- Enhanced README with comprehensive project documentation
- Improved CI/CD workflow with better test coverage reporting
- Updated LICENSE for dual MIT/Commercial licensing
- Refactored ContractCast with status field persistence
- Enhanced GraphQL types with additional fields

### Fixed
- Docker image optimized by removing test dependencies
- Chain configuration constant naming

## [1.1.0] - 2024-10-03

### Added
- Unique `name` field for ContractCast with database constraint
  - Database migration to add `name` column with unique index
  - GraphQL schema updated to support name field
- Enhanced EVMContractCast class with comprehensive documentation
- ContractCast status tracking (`IDLE`, `RUNNING`, `STOPPED`, etc.)
- Getter methods for ContractCast properties (`getName`, `getId`, `getStatus`, etc.)

### Changed
- Improved logging throughout the codebase
  - Logs now display ContractCast name for better traceability
  - More uniform log formatting across components
- Refactored ContractCast class with better encapsulation
- Updated chain configuration structure in `src/constants/chains.ts`
- Enhanced GraphQL resolvers with improved error handling
- Updated example configurations for better clarity

### Fixed
- `addCast` function now properly handles cast registration
- Contract event listener initialization issues
- Time utility edge cases

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Chain Cast
- Smart contract event listening and recovery
- Programmable event processing pipeline
- GraphQL API with Prisma ORM
- Support for multiple blockchain networks
- Real-time event streaming capabilities
- Integration with external systems (databases, message queues, analytics)
- Support for ERC20, ERC721, ERC1155, and custom contract types
- Comprehensive logging and monitoring
- TypeScript implementation with full type safety
- Jest testing framework with coverage reporting
- ESLint and Prettier for code quality
- Docker support for containerized deployment

### Features
- **Event Listening**: Real-time monitoring of smart contract events
- **Event Recovery**: Automatic recovery of missed events during network interruptions
- **Processing Pipeline**: Customizable event processing with transformation, filtering, and enrichment
- **Multi-Chain Support**: Support for Ethereum, Polygon, BSC, and other EVM-compatible chains
- **GraphQL API**: Modern GraphQL interface for data access and manipulation
- **Queue Management**: BullMQ integration for reliable job processing
- **Database Integration**: PostgreSQL with Prisma ORM for data persistence
- **External Integrations**: Webhook support, Elasticsearch integration, spreadsheet exports

### Technical Stack
- **Runtime**: Bun 1.0+
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL with Prisma ORM
- **API**: GraphQL with GraphQL Yoga + Pothos
- **Testing**: Bun's built-in test framework
- **Code Quality**: Biome (linting + formatting)
- **Queue**: BullMQ with Redis
- **Blockchain**: viem for EVM interaction

---

## Version History

- **1.2.0**: Major runtime and tooling migration (Bun, viem, Biome) + comprehensive tests
- **1.1.1**: Open source documentation, GitHub templates, and developer tooling
- **1.1.0**: ContractCast naming, status tracking, and improved logging
- **1.0.0**: Initial release with core functionality

## Contributing

When adding entries to this changelog, please follow the format specified in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

### Types of Changes

- **Added**: for new features
- **Changed**: for changes in existing functionality
- **Deprecated**: for soon-to-be removed features
- **Removed**: for now removed features
- **Fixed**: for any bug fixes
- **Security**: in case of vulnerabilities

## Links

- [GitHub Releases](https://github.com/layerx-labs/chain-cast/releases)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)