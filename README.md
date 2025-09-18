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
- 🧪 **Well-tested** - Comprehensive tests across unit and integration
- 📝 **Automatic validation** - Parameter parsing and validation with Zod
- 🛠️ **Custom routes** - Extend generated APIs with custom route handlers
- 📦 **Minimal dependencies** - Only essential dependencies (Fastify + Zod)

## 🚀 Quick Start

### Installation

```bash
npm install frey
```

### Basic Example

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "frey";

// Define your Zod schema
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// Define the entity with CRUD handlers
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, { request, server }) => {
    // Your findAll logic here
    return [/* array of users */];
  },
  findOne: async (param, { request, server }) => {
    // Your findOne logic here
    return {/* single user */};
  },
});

// Start the server
const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
});
```

This automatically creates REST endpoints: `GET /users`, `POST /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`

## 📖 Documentation

For complete documentation, examples, and API reference, visit our documentation website:

**[📚 Read the full documentation →](https://frey-docs.vercel.app)**

## 🛠️ Development

```bash
# Clone and setup
git clone https://github.com/yourusername/frey.git
cd frey
npm install

# Development
npm run dev          # Start dev server
npm run test:run     # Run tests
npm run type-check   # TypeScript check
npm run format:fix   # Format code
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.