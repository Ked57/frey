# Frey

[![CI](https://github.com/Ked57/frey/workflows/CI/badge.svg)](https://github.com/yourusername/frey/actions)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Compatible-000000.svg)](https://bun.sh/)

A lightweight, entity-driven API framework built with Fastify and TypeScript. Frey provides a structured way to define entities with Zod schemas and automatically generates RESTful APIs with full type safety and support for both Node.js and Bun runtimes.

## ✨ Features

- 🚀 **Entity-driven API generation** - Define entities and get full CRUD APIs automatically
- ⚡ **Multi-runtime support** - Works with both Node.js and Bun
- 🔒 **Type-safe** - Built with TypeScript strict mode for maximum type safety
- 🧪 **Well-tested** - 53 comprehensive tests across unit and integration
- 📝 **Automatic validation** - Parameter parsing and validation with Zod
- 🛠️ **Custom routes** - Extend generated APIs with custom route handlers
- 📦 **Minimal dependencies** - Only essential dependencies (Fastify + Zod)
- 🔄 **Automatic versioning** - Semantic release with conventional commits

## 🚀 Quick Start

### Installation

```bash
npm install freyjs-test
```

### Basic Usage

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "freyjs-test";

// Define your Zod schema
const userSchema = z.object({
  uuid: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
});

// Define the entity with CRUD handlers
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customId: "uuid",
  customRoutes: [
    {
      path: "/stats",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        reply.send({
          totalUsers: 42,
          activeUsers: 38,
          entityName: entity.name,
        });
      },
    },
  ],
  findAll: async (params, { request, server }) => {
    // Your findAll logic here
    return [/* array of users */];
  },
  findOne: async (param, { request, server }) => {
    // Your findOne logic here
    return {/* single user */};
  },
  // Optional CRUD handlers
   create: async (params, context) => { /* create logic */ },
   update: async (params, context) => { /* update logic */ },
   delete: async (params, context) => { /* delete logic */ },
});

// Start the server
const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
});
```

This automatically creates the following REST endpoints:
- `GET /users` - List all users (calls your `findAll` handler)
- `POST /users` - Create a new user (calls your `create` handler)
- `GET /users/:id` - Get a specific user (calls your `findOne` handler)
- `PUT /users/:id` - Update a user (calls your `update` handler)
- `DELETE /users/:id` - Delete a user (calls your `delete` handler)
- `GET /users/stats` - Custom route (calls your custom route handler)

## 📖 API Reference

### Entity Definition

```typescript
defineEntity<Schema extends z.ZodObject<any>>(entity: Entity<Schema>)
```

**Entity Configuration:**
- `name: string` - Entity name (used for route paths)
- `schema: ZodObject` - Zod schema for validation and type safety
- `customId?: string` - Custom ID field name (defaults to 'id')
- `customRoutes?: CustomRoute[]` - Array of custom routes
- `findAll: (params, context) => Promise<Array>` - Required handler for GET /entities
- `findOne?: (param, context) => Promise<Object>` - Optional handler for GET /entities/:id
- `create?: (params, context) => Promise<Object>` - Optional handler for POST /entities
- `update?: (params, context) => Promise<Object>` - Optional handler for PUT /entities/:id
- `delete?: (params, context) => Promise<void>` - Optional handler for DELETE /entities/:id

**Example:**
```typescript
const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  inStock: z.boolean(),
  createdAt: z.date(),
});

const productEntity = defineEntity({
  name: "product",
  schema: productSchema,
  customId: "id",
  findAll: async (params, { request, server }) => {
    // Your database query logic
    return await db.products.findMany();
  },
  // ... other handlers
});
```

### Custom Routes

```typescript
type CustomRoute<Schema> = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  registerRoute: (request, reply, context) => Promise<void> | void;
}
```

Add custom route handlers alongside generated CRUD operations:

```typescript
customRoutes: [
  {
    path: "/search",
    method: "GET",
    registerRoute: async (request, reply, { server, entity }) => {
      const query = request.query.q;
      // Your custom search logic
      reply.send({ results: [] });
    },
  },
]
```

### Server Configuration

```typescript
startServer(fastify: FastifyInstance, options: ServerOptions)
```

Start the HTTP server with your entities:

```typescript
const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity, productEntity],
  port: 3000,
  host: '0.0.0.0',
});
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ or Bun
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/frey.git
cd frey

# Install dependencies
npm install

# Run in dev mode
npm run dev

# Without watch mode
npm run dev:nowatch

# Run tests
npm run test:run

# Run tests with Bun
bun test

# Type checking
npm run type-check

# Format code
npm run format:fix
```

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - TypeScript compilation check
- `npm run build:dist` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage
- `npm run format` - Check code formatting
- `npm run format:fix` - Fix code formatting
- `npm run type-check` - TypeScript strict mode check
- `npm run audit` - Security audit

## 🧪 Testing

Frey includes a comprehensive test suite with 53 tests covering:

- **Unit tests** - Core functionality and helpers
- **Integration tests** - Full API endpoints and parameter parsing
- **Multi-runtime tests** - Compatibility with Node.js and Bun

Run tests with different runners:

```bash
# Node.js (default)
npm run test:run

# Bun (3x faster)
bun test

# With coverage
npm run test:coverage
```

## 📦 Performance

Frey is optimized for performance:

- **Bun support** - Compatible with Bun runtime
- **Minimal overhead** - Only essential dependencies
- **TypeScript compilation** - Zero runtime type checking overhead
- **Fastify foundation** - One of the fastest Node.js web frameworks

## 🔄 Release Process

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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- Powered by [Zod](https://zod.dev/) - TypeScript-first schema validation
- Tested with [Vitest](https://vitest.dev/) - Fast unit test framework
- Compatible with [Bun](https://bun.sh/) - JavaScript runtime