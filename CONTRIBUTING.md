---
noteId: "0d1b7090b1d311eb8c4ed19e49359bd0"
tags: []

---

# Contributing to Chain Cast

Thank you for your interest in contributing to Chain Cast! This document provides guidelines and information for contributors.

**Open Source Project**: Chain Cast is developed and maintained by LayerX Labs. Commercial licenses are managed by LayerX Labs.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [DAO Governance](#dao-governance)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Style](#code-style)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Commercial Licensing

- **Open Source**: MIT License for open source and non-commercial use
- **Commercial Use**: Requires LayerX Labs approval and commercial license
- **Contact**: gm@layerx.xyz for commercial licensing inquiries

## Getting Started

### Prerequisites

- **Node.js**: 20.0.0 or above
- **PostgreSQL**: 12 or above
- **Git**: Latest version
- **npm**: 8.0.0 or above

### Fork and Clone

1. **Fork the repository**
   - Go to [https://github.com/layerx-labs/chain-cast](https://github.com/layerx-labs/chain-cast)
   - Click the "Fork" button in the top right

2. **Clone your fork**
   ```bash
   git clone git@github.com:YOUR_USERNAME/chain-cast.git
   cd chain-cast
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream git@github.com:layerx-labs/chain-cast.git
   git fetch upstream
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/chaincast?schema=public
LOG_LEVEL=debug
SILENT=false
LOG_TO_FILE=false
CHAIN_CAST_API_PORT=4400
```

### 3. Database Setup

```bash
npm run db:reset
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:4400/graphql`

## Making Changes

### Branch Strategy

- **main/master**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature branches
- **bugfix/***: Bug fix branches
- **hotfix/***: Critical production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add new contract cast endpoint
fix(db): resolve database connection timeout
docs(readme): update installation instructions
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in debug mode
npm run test:debug

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check code formatting
npm run pretty
```

### Writing Tests

- Write tests for all new functionality
- Aim for at least 80% code coverage
- Use descriptive test names
- Test both success and failure cases

Example test structure:

```typescript
describe('ContractCast', () => {
  describe('create', () => {
    it('should create a new contract cast', async () => {
      // Test implementation
    });

    it('should throw error for invalid contract address', async () => {
      // Test implementation
    });
  });
});
```

## Submitting Changes

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/develop
```

### 2. Run Tests

```bash
npm run test
npm run lint
npm run build
```

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select `develop` as the base branch
4. Fill out the PR template
5. Submit the PR

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** for answers
3. **Try to reproduce** the issue in a clean environment

### Issue Templates

We provide templates for:
- [Bug Reports](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Requests](.github/ISSUE_TEMPLATE/feature_request.md)
- [Questions](.github/ISSUE_TEMPLATE/question.md)

### Good Issue Reports Include

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs (if applicable)
- Screenshots (if applicable)

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No new warnings are generated
- [ ] Code is self-reviewed

### PR Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer must approve
3. **Documentation**: Ensure docs are updated if needed
4. **Testing**: Verify changes work as expected

### PR Template

We provide a [PR template](.github/pull_request_template.md) to help structure your submissions.

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Provide proper type annotations
- Use interfaces for object shapes
- Prefer `const` over `let`
- Use async/await over Promises

### Naming Conventions

- **Files**: kebab-case (`contract-cast.ts`)
- **Classes**: PascalCase (`ContractCast`)
- **Functions/Variables**: camelCase (`getContractEvents`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)

### Code Organization

```
src/
├── config/          # Configuration files
├── constants/       # Constants and enums
├── graphql/         # GraphQL schema and resolvers
├── instructions/    # Processing instructions
├── lib/            # Core library code
├── middleware/     # Express middleware
├── services/       # Business logic services
├── types/          # TypeScript type definitions
└── util/           # Utility functions
```

## Documentation

### Documentation Standards

- Write clear, concise documentation
- Include code examples
- Keep documentation up to date with code changes
- Use proper markdown formatting

### Documentation Files

- `README.md`: Project overview and quick start
- `doc/README.md`: API documentation
- `CONTRIBUTING.md`: This file
- `CODE_OF_CONDUCT.md`: Community guidelines
- `SECURITY.md`: Security policy
- `CHANGELOG.md`: Version history

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Contact**: gm@layerx.xyz for commercial licensing inquiries

### Recognition

Contributors will be recognized in:
- [Contributors list](https://github.com/layerx-labs/chain-cast/graphs/contributors)
- Release notes
- Project documentation

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussion

### Commercial Contributions

For commercial contributions or enterprise features, please contact LayerX Labs at gm@layerx.xyz.

## Additional Resources

- [GraphQL Documentation](https://graphql.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bun Test Framework](https://bun.sh/docs/cli/test)

## Questions?

If you have questions about contributing, feel free to:
1. Open a [GitHub issue](https://github.com/layerx-labs/chain-cast/issues)
2. Start a [GitHub discussion](https://github.com/layerx-labs/chain-cast/discussions)
3. Contact us at gm@layerx.xyz

Thank you for contributing to Chain Cast! 🚀
