---
title: API Reference
description: Complete reference for all Frey APIs, types, and generated routes
order: 8
---

# API Reference

Complete reference for all Frey APIs and types.

## Core Functions

### `defineEntity<Schema>(entity: Entity<Schema>)`

Creates a new entity definition with CRUD operations and custom routes.

**Parameters:**
- `entity: Entity<Schema>` - Entity configuration object

**Returns:**
- `Entity<Schema>` - Configured entity ready for use with `startServer`

**Example:**
```typescript
import { defineEntity } from "frey";
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, context) => {
    return await database.users.findMany();
  },
});
```

### `startServer(fastify: FastifyInstance, options: ServerOptions)`

Starts the HTTP server with the provided entities.

**Parameters:**
- `fastify: FastifyInstance` - Fastify server instance
- `options: ServerOptions` - Server configuration

**Example:**
```typescript
import Fastify from "fastify";
import { startServer } from "frey";

const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  host: '0.0.0.0',
});
```

## Types

### `Entity<Schema>`

Entity configuration object.

```typescript
type Entity<Schema extends z.ZodObject<any>> = {
  name: string;                    // Required: Entity name
  schema: Schema;                  // Required: Zod schema
  customId?: string;              // Optional: Custom ID field name
  customRoutes?: CustomRoute[];    // Optional: Custom routes
  findAll: Handler;               // Required: GET /entity handler
  findOne?: Handler;              // Optional: GET /entity/:id handler
  create?: Handler;               // Optional: POST /entity handler
  update?: Handler;               // Optional: PUT /entity/:id handler
  delete?: Handler;               // Optional: DELETE /entity/:id handler
};
```

### `ServerOptions`

Server configuration options.

```typescript
type ServerOptions = {
  entities: Entity[];             // Required: Array of entities
  port?: number;                   // Optional: Server port (default: 3000)
  host?: string;                   // Optional: Server host (default: 'localhost')
  swagger?: SwaggerConfig;         // Optional: Swagger documentation config
  auth?: AuthConfig;               // Optional: Authentication configuration
};
```

### `Handler`

Handler function type for CRUD operations.

```typescript
type Handler = (
  params: any,
  context: Context
) => Promise<any> | any;
```

### `Context`

Context object passed to handlers.

```typescript
type Context = {
  request: FastifyRequest;        // Fastify request object
  server: FastifyInstance;        // Fastify server instance
  auth: AuthContext;              // Authentication context
};
```

### `CustomRoute`

Custom route configuration.

```typescript
type CustomRoute = {
  path: string;                   // Route path (relative to entity)
  method: HTTPMethod;             // HTTP method
  auth?: RouteAuthConfig;         // Optional: Route-specific auth config
  customErrors?: CustomErrorHandler; // Optional: Custom error responses
  registerRoute: RouteHandler;    // Route handler function
};
```

### `HTTPMethod`

Supported HTTP methods.

```typescript
type HTTPMethod = 
  | "GET" 
  | "POST" 
  | "PUT" 
  | "DELETE" 
  | "PATCH" 
  | "HEAD" 
  | "OPTIONS";
```

### `RouteHandler`

Custom route handler function.

```typescript
type RouteHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
  context: { server: FastifyInstance; entity: Entity }
) => Promise<void> | void;
```

### `Params`

Query parameters object.

```typescript
type Params = {
  limit?: number;                 // Items per page
  offset?: number;                // Items to skip
  sort?: string;                  // Sort field
  order?: 'asc' | 'desc';         // Sort direction
  search?: string;                // Search term
  filters?: Record<string, any>;  // Field filters
};
```

### `QueryParams`

Extended query parameters.

```typescript
type QueryParams = Params & {
  [key: string]: any;             // Additional custom parameters
};
```

### Authentication Types

#### `AuthConfig`

Global authentication configuration.

```typescript
type AuthConfig = {
  enabled?: boolean;               // Enable authentication globally
  jwt?: JwtConfig;                // JWT configuration
  apiKey?: ApiKeyConfig;          // API key configuration
  requireAuth?: boolean;           // Default auth requirement (default: true when enabled)
};
```

#### `JwtConfig`

JWT authentication configuration.

```typescript
type JwtConfig = {
  secret: string;                 // JWT signing secret
  expiresIn?: string;             // Token expiration (default: "1h")
  issuer?: string;                 // JWT issuer
  audience?: string;               // JWT audience
  extractUser?: (decoded: any) => Promise<User | null>;
};
```

#### `ApiKeyConfig`

API key authentication configuration.

```typescript
type ApiKeyConfig = {
  headerName?: string;            // Header name (default: "x-api-key")
  validateKey: (key: string) => Promise<User | null>;
};
```

#### `RouteAuthConfig`

Route-level authentication configuration.

```typescript
type RouteAuthConfig = {
  requireAuth?: boolean;          // Require authentication (default: true when auth.enabled)
  jwtOnly?: boolean;              // Require JWT authentication only
  apiKeyOnly?: boolean;           // Require API key authentication only
  customAuth?: (request: any) => Promise<boolean>;
};
```

#### `AuthContext`

Authentication context available in handlers.

```typescript
type AuthContext = {
  user?: User;                     // Authenticated user (if any)
  isAuthenticated: boolean;       // Authentication status
  token?: string;                  // JWT token (if JWT auth)
  apiKey?: string;                 // API key (if API key auth)
  authMethod?: 'jwt' | 'api-key'; // Authentication method used
};
```

#### `User`

User object structure.

```typescript
type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
};
```

#### `CustomErrorHandler`

Custom error response configuration.

```typescript
type CustomErrorHandler = {
  [statusCode: number]: {
    error: string;
    message: string;
    details?: any;
  };
};
```

#### `SwaggerConfig`

Swagger documentation configuration.

```typescript
type SwaggerConfig = {
  enabled?: boolean;                // Enable Swagger UI (default: false)
  title?: string;                   // API title (default: "Frey API")
  description?: string;             // API description
  version?: string;                 // API version (default: "1.0.0")
  routePrefix?: string;             // Swagger UI route (default: "/documentation")
  uiConfig?: {
    docExpansion?: "list" | "full" | "none";  // Operation expansion (default: "full")
    deepLinking?: boolean;          // Enable deep linking (default: false)
  };
};
```

### `OrderField`

Sort field configuration.

```typescript
type OrderField = {
  field: string;                 // Field name
  direction: 'asc' | 'desc';      // Sort direction
};
```

## Generated Routes

For each entity, Frey automatically generates the following routes:

### `GET /{entity}`

Lists all entities with optional filtering, sorting, and pagination.

**Query Parameters:**
- `limit?: number` - Number of items to return
- `offset?: number` - Number of items to skip
- `sort?: string` - Field to sort by
- `order?: 'asc' | 'desc'` - Sort direction
- `search?: string` - Search term
- `filters?: object` - Field-specific filters

**Handler:** `findAll`

**Example:**
```bash
GET /users?limit=10&offset=0&sort=name&order=asc&search=john&filters[isActive]=true
```

### `POST /{entity}`

Creates a new entity.

**Request Body:** Validated against entity schema

**Handler:** `create`

**Example:**
```bash
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### `GET /{entity}/:id`

Retrieves a specific entity by ID.

**URL Parameters:**
- `id` - Entity identifier

**Handler:** `findOne`

**Example:**
```bash
GET /users/123
```

### `PUT /{entity}/:id`

Updates an existing entity.

**URL Parameters:**
- `id` - Entity identifier

**Request Body:** Validated against entity schema

**Handler:** `update`

**Example:**
```bash
PUT /users/123
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### `DELETE /{entity}/:id`

Deletes an entity.

**URL Parameters:**
- `id` - Entity identifier

**Handler:** `delete`

**Example:**
```bash
DELETE /users/123
```

## Error Handling

Frey provides consistent error handling across all endpoints.

### Validation Errors

When request data doesn't match the entity schema:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

### Handler Errors

When handlers throw errors:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

### Not Found Errors

When entities are not found:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Entity not found"
}
```

## Utility Functions

### `z` (Zod)

Frey re-exports Zod for convenience:

```typescript
import { z } from "frey";

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});
```

## Best Practices

1. **Use TypeScript**: Leverage TypeScript for better development experience
2. **Validate schemas**: Use Zod schemas for runtime validation
3. **Handle errors**: Always handle potential errors in handlers
4. **Use appropriate HTTP methods**: Follow REST conventions
5. **Document custom routes**: Consider adding OpenAPI documentation
6. **Test thoroughly**: Write tests for all handlers and custom routes

## Examples

### Basic Entity

```typescript
import { defineEntity, startServer } from "frey";
import { z } from "zod";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  inStock: z.boolean(),
});

const productEntity = defineEntity({
  name: "product",
  schema: productSchema,
  findAll: async (params, { request, server }) => {
    return await database.products.findMany();
  },
  findOne: async (param, { request, server }) => {
    return await database.products.findUnique({
      where: { id: param.id }
    });
  },
  create: async (params, { request, server }) => {
    return await database.products.create({ data: params });
  },
  update: async (params, { request, server }) => {
    return await database.products.update({
      where: { id: params.id },
      data: params.data
    });
  },
  delete: async (params, { request, server }) => {
    await database.products.delete({
      where: { id: params.id }
    });
  },
});

const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [productEntity],
  port: 3000,
});
```

### Entity with Custom Routes

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customRoutes: [
    {
      path: "/stats",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const totalUsers = await database.users.count();
        const activeUsers = await database.users.count({
          where: { isActive: true }
        });
        
        reply.send({
          totalUsers,
          activeUsers,
          entityName: entity.name,
        });
      },
    },
    {
      path: "/search",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const query = request.query.q as string;
        const users = await database.users.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
            ],
          },
        });
        
        reply.send({ results: users, query });
      },
    },
  ],
  findAll: async (params, { request, server }) => {
    return await database.users.findMany();
  },
});
```

## Next Steps

- Learn about [Getting Started](./getting-started.md) for basic usage
- Explore [Entity Configuration](./entity-configuration.md) for advanced options
- Check out [Examples](./examples.md) for real-world use cases
