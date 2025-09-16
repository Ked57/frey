feat: initial release of Frey framework

Introduce Frey, a lightweight entity-driven API framework built with Fastify and TypeScript.

## Core Features

- **Entity-driven API generation**: Automatically generate full CRUD APIs from entity definitions
- **Multi-runtime support**: Compatible with both Node.js and Bun (3x faster with Bun)
- **Type-safe development**: Built with TypeScript strict mode for maximum type safety
- **Comprehensive testing**: 53 tests across unit and integration scenarios
- **Automatic validation**: Parameter parsing and validation with Zod
- **Custom route support**: Extend generated APIs with custom route handlers
- **Zero dependencies**: Minimal footprint with only essential dependencies

## Technical Implementation

- Fastify-based HTTP server with automatic route generation
- Entity definition system with type inference
- Parameter parsing and validation using Zod schemas
- Support for custom route handlers alongside generated CRUD operations
- Multi-runtime compatibility (Node.js 18+, Bun)
- Comprehensive test suite with Vitest
- TypeScript strict mode with full type coverage

## Development Workflow

- Automated CI/CD pipeline with GitHub Actions
- Semantic versioning with conventional commits
- Automated changelog generation
- Multi-runtime testing (Node.js + Bun)
- Code formatting with Prettier
- Security auditing with npm audit

## API Examples

```typescript
import { Frey } from 'frey.js';

const app = new Frey();

// Define entities and get full CRUD APIs
app.entity('User', {
  name: 'string',
  email: 'string',
  age: 'number'
});

// Add custom routes
app.custom('/users/search', (req, res) => {
  // Custom logic
});

app.listen(3000);
```

This initial release provides a solid foundation for rapid API development with automatic CRUD generation, type safety, and multi-runtime support.
