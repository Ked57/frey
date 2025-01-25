# Frey

A lightweight, entity-driven API framework built with Fastify and TypeScript. Frey automatically generates RESTful APIs from entity definitions with support for both Node.js and Bun runtimes.

## Features

- 🚀 **Entity-driven API generation** - Define entities and get full CRUD APIs automatically
- ⚡ **Multi-runtime support** - Works with both Node.js and Bun (3x faster with Bun)
- 🔒 **Type-safe** - Built with TypeScript strict mode for maximum type safety
- 🧪 **Well-tested** - 53 comprehensive tests across unit and integration
- 📝 **Automatic validation** - Parameter parsing and validation with Zod
- 🛠️ **Custom routes** - Extend generated APIs with custom route handlers
- 📦 **Zero dependencies** - Minimal footprint with only essential dependencies

## Quick Start

```bash
npm install frey
```

```typescript
import { Frey } from 'frey';

const app = new Frey();

// Define an entity
app.entity('User', {
  name: 'string',
  email: 'string',
  age: 'number'
});

// Start the server
app.listen(3000);
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm run test:run

# Run tests with Bun (3x faster)
bun test

# Type checking
npm run type-check

# Format code
npm run format:fix
```

## Release Process

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automatic versioning and changelog generation.

### Automatic Releases

- **Master branch**: Automatically releases on every commit that follows [Conventional Commits](https://conventionalcommits.org/)
- **Beta branch**: Creates prerelease versions for testing

### Manual Releases

Use the GitHub Actions "Manual Release" workflow to trigger releases manually:
- **Patch**: Bug fixes and minor updates
- **Minor**: New features (backward compatible)
- **Major**: Breaking changes
- **Prerelease**: Beta/alpha versions

### Commit Convention

Follow [Conventional Commits](https://conventionalcommits.org/) for automatic versioning:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `BREAKING CHANGE:` - Breaking changes (major version bump)
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` - No version bump

## License

ISC