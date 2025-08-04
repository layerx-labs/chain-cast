# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced README with comprehensive documentation
- Security policy and vulnerability reporting guidelines
- Environment configuration examples
- Improved contributing guidelines

### Changed
- Updated project structure for better open source experience
- Enhanced CI/CD workflow documentation

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
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **API**: GraphQL with GraphQL Yoga
- **Testing**: Jest with coverage reporting
- **Code Quality**: ESLint + Prettier
- **Queue**: BullMQ with Redis
- **Blockchain**: Ethers.js for EVM interaction

---

## Version History

- **1.0.0**: Initial release with core functionality
- **Unreleased**: Open source preparation and documentation improvements

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