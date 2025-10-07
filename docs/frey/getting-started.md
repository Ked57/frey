---
title: Getting Started
description: Learn how to build your first API with Frey in just a few minutes
order: 1
---

# Getting Started

Welcome to Frey! This guide will help you get up and running with Frey in just a few minutes.

## What is Frey?

Frey is a lightweight, entity-driven API framework built with Fastify and TypeScript. It provides a structured way to define entities with Zod schemas and automatically generates RESTful APIs with full type safety.

## Key Features

- 🚀 **Entity-driven API generation** - Define entities and get full CRUD APIs automatically
- ⚡ **Multi-runtime support** - Works with both Node.js and Bun
- 🔒 **Type-safe** - Built with TypeScript strict mode for maximum type safety
- 🛡️ **Authentication & Security** - JWT and API key authentication with secure-by-default behavior
- 👥 **Role-Based Access Control** - Granular permissions based on user roles and entity ownership
- 🧪 **Well-tested** - Comprehensive tests across unit and integration
- 📝 **Automatic validation** - Parameter parsing and validation with Zod
- 🛠️ **Custom routes** - Extend generated APIs with custom route handlers
- 📦 **Minimal dependencies** - Only essential dependencies (Fastify + Zod)

## Installation

```bash
npm install frey fastify
```

## Your First API

Let's create a simple user API to get started:

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "frey";

// 1. Define your Zod schema
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
});

// 2. Define the entity with CRUD handlers
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, { request, server }) => {
    // Your findAll logic here - e.g., database query
    return [
      { id: "1", name: "John Doe", email: "john@example.com", createdAt: new Date() },
      { id: "2", name: "Jane Smith", email: "jane@example.com", createdAt: new Date() },
    ];
  },
  findOne: async (param, { request, server }) => {
    // Your findOne logic here - e.g., find by ID
    return { id: param.id, name: "John Doe", email: "john@example.com", createdAt: new Date() };
  },
  create: async (params, { request, server }) => {
    // Your create logic here - e.g., save to database
    return { ...params, id: "3", createdAt: new Date() };
  },
  update: async (params, { request, server }) => {
    // Your update logic here - e.g., update in database
    return { ...params, updatedAt: new Date() };
  },
  delete: async (params, { request, server }) => {
    // Your delete logic here - e.g., remove from database
    // No return value needed for delete operations
  },
});

// 3. Start the server
const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
});
```

## What Just Happened?

When you run this code, Frey automatically creates the following REST endpoints:

- `GET /users` - List all users (calls your `findAll` handler)
- `POST /users` - Create a new user (calls your `create` handler)
- `GET /users/:id` - Get a specific user (calls your `findOne` handler)
- `PUT /users/:id` - Update a user (calls your `update` handler)
- `DELETE /users/:id` - Delete a user (calls your `delete` handler)

## Testing Your API

You can test your API using curl or any HTTP client:

```bash
# Get all users
curl http://localhost:3000/users

# Get a specific user
curl http://localhost:3000/users/1

# Create a new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'

# Update a user
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated", "email": "john.updated@example.com"}'

# Delete a user
curl -X DELETE http://localhost:3000/users/1
```

## Next Steps

Now that you have a basic understanding of Frey, explore these topics:

- [Entity Configuration](./entity-configuration.md) - Learn about advanced entity options
- [Custom Routes](./custom-routes.md) - Add custom endpoints to your entities
- [Parameter Handling](./parameter-handling.md) - Understand how Frey handles query parameters
- [Type Safety](./type-safety.md) - Leverage TypeScript for maximum type safety
- [Swagger Documentation](./swagger.md) - Generate interactive API documentation
- [Authentication](./authentication.md) - Secure your APIs with JWT and API key authentication
- [Examples](./examples.md) - See real-world examples and use cases

## Need Help?

- Check out the [API Reference](./api-reference.md) for detailed documentation
- Look at [Examples](./examples.md) for inspiration
- Join our community discussions for support
