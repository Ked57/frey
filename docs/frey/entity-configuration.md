---
title: Entity Configuration
description: Learn how to configure entities with advanced options and handlers
order: 2
---

# Entity Configuration

Entities are the core building blocks of Frey. They define the structure of your data and the operations you can perform on it.

## Basic Entity Structure

```typescript
import { defineEntity } from "frey";
import { z } from "zod";

const userEntity = defineEntity({
  name: "user",           // Required: Entity name (used for routes)
  schema: userSchema,     // Required: Zod schema for validation
  customId: "uuid",       // Optional: Custom ID field name
  customRoutes: [...],    // Optional: Custom route handlers
  findAll: async (...) => {...},  // Required: Handler for GET /users
  findOne: async (...) => {...},  // Optional: Handler for GET /users/:id
  create: async (...) => {...},   // Optional: Handler for POST /users
  update: async (...) => {...},  // Optional: Handler for PUT /users/:id
  delete: async (...) => {...},  // Optional: Handler for DELETE /users/:id
});
```

## Required Properties

### `name: string`

The entity name determines the route paths. For example:
- `name: "user"` creates routes like `/users`, `/users/:id`
- `name: "product"` creates routes like `/products`, `/products/:id`

### `schema: ZodObject`

The Zod schema defines the structure and validation rules for your entity:

```typescript
const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  isActive: z.boolean(),
  createdAt: z.date(),
  tags: z.array(z.string()).optional(),
});
```

### `findAll: Handler`

The `findAll` handler is required and handles `GET /entity` requests:

```typescript
findAll: async (params, { request, server }) => {
  // params contains parsed query parameters
  // request is the Fastify request object
  // server is the Fastify instance
  
  const users = await database.users.findMany({
    where: params.filters,
    orderBy: params.orderBy,
    take: params.limit,
    skip: params.offset,
  });
  
  return users;
}
```

## Optional Properties

### `customId: string`

By default, Frey uses `"id"` as the identifier field. Use `customId` to specify a different field:

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customId: "uuid",  // Now routes use /users/:uuid instead of /users/:id
  findAll: async (...) => {...},
});
```

### Handler Functions

All handler functions are optional except `findAll`. Each handler receives parameters and context:

#### `findOne: Handler`

Handles `GET /entity/:id` requests:

```typescript
findOne: async (param, { request, server }) => {
  // param.id contains the ID from the URL
  const user = await database.users.findUnique({
    where: { id: param.id }
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}
```

#### `create: Handler`

Handles `POST /entity` requests:

```typescript
create: async (params, { request, server }) => {
  // params contains the validated request body
  const user = await database.users.create({
    data: params
  });
  
  return user;
}
```

#### `update: Handler`

Handles `PUT /entity/:id` requests:

```typescript
update: async (params, { request, server }) => {
  // params contains both the ID and the update data
  const user = await database.users.update({
    where: { id: params.id },
    data: params.data
  });
  
  return user;
}
```

#### `delete: Handler`

Handles `DELETE /entity/:id` requests:

```typescript
delete: async (params, { request, server }) => {
  // params.id contains the ID from the URL
  await database.users.delete({
    where: { id: params.id }
  });
  
  // No return value needed for delete operations
}
```

## Handler Context

All handlers receive a context object with useful properties:

```typescript
type Context = {
  request: FastifyRequest;  // Fastify request object
  server: FastifyInstance;  // Fastify server instance
  entity: Entity;           // The entity definition
};
```

### Using the Context

```typescript
findAll: async (params, { request, server, entity }) => {
  // Access request headers
  const authHeader = request.headers.authorization;
  
  // Access query parameters
  const search = request.query.search;
  
  // Use the server instance for additional operations
  const cache = server.cache;
  
  // Access entity information
  console.log(`Fetching ${entity.name} entities`);
  
  return await database.users.findMany();
}
```

## Advanced Configuration

### Complex Schemas

You can define complex nested schemas:

```typescript
const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  category: z.object({
    id: z.string(),
    name: z.string(),
  }),
  tags: z.array(z.string()),
  metadata: z.record(z.any()).optional(),
  variants: z.array(z.object({
    id: z.string(),
    size: z.string(),
    color: z.string(),
    stock: z.number().int().min(0),
  })),
});
```

### Conditional Validation

Use Zod's conditional validation for complex business rules:

```typescript
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
  permissions: z.array(z.string()).optional(),
}).refine((data) => {
  // Admin users must have permissions
  if (data.role === "admin" && (!data.permissions || data.permissions.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Admin users must have at least one permission",
  path: ["permissions"],
});
```

## Best Practices

1. **Keep schemas focused**: Each entity should represent a single concept
2. **Use descriptive names**: Choose clear, descriptive names for your entities
3. **Validate early**: Let Zod handle validation before your business logic
4. **Handle errors gracefully**: Always handle potential errors in your handlers
5. **Use TypeScript**: Leverage TypeScript for better development experience

## Next Steps

- Learn about [Custom Routes](./custom-routes.md) to extend your entities
- Understand [Parameter Handling](./parameter-handling.md) for advanced querying
- Explore [Type Safety](./type-safety.md) for better development experience
