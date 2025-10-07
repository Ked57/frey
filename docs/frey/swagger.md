---
title: Swagger Documentation
description: Generate interactive API documentation with Swagger/OpenAPI
order: 6
---

# Swagger Documentation

Frey automatically generates interactive API documentation using Swagger/OpenAPI 3.0. This documentation is enabled by default and provides a comprehensive view of your API endpoints, schemas, and authentication requirements.

## Quick Start

Swagger documentation is enabled by default. Simply start your server and visit the documentation:

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "frey";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, { auth }) => {
    return [{ id: "1", name: "John", email: "john@example.com", role: "user" }];
  },
});

const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  // Swagger is enabled by default
});

// Documentation available at: http://localhost:3000/documentation
```

## Configuration

### Basic Configuration

```typescript
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  swagger: {
    enabled: true,                    // Enable Swagger UI (default: true)
    title: "My API",                 // API title (default: "Frey API")
    description: "My awesome API",   // API description
    version: "2.0.0",               // API version (default: "1.0.0")
    routePrefix: "/docs",           // Swagger UI route (default: "/documentation")
    uiConfig: {
      docExpansion: "full",         // Expand all operations (default: "full")
      deepLinking: true,            // Enable deep linking (default: false)
    },
  },
});
```

### Swagger Configuration Options

```typescript
type SwaggerConfig = {
  enabled?: boolean;                // Enable Swagger UI (default: true)
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

## Documentation Features

### Automatic Schema Generation

Frey automatically generates OpenAPI schemas from your Zod schemas:

```typescript
const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  category: z.object({
    id: z.string(),
    name: z.string(),
  }),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.date(),
});

// Automatically generates:
// - Request/response schemas
// - Validation rules
// - Type definitions
// - Example values
```

### CRUD Operations Documentation

Each entity automatically generates documentation for:

- **GET /{entity}** - List entities with query parameters
- **POST /{entity}** - Create new entity
- **GET /{entity}/{id}** - Get specific entity
- **PUT /{entity}/{id}** - Update entity
- **DELETE /{entity}/{id}** - Delete entity

### Query Parameters

Query parameters are automatically documented:

```typescript
// GET /users?limit=10&offset=0&sort=name&order=asc&search=john&filters[isActive]=true
```

**Documented Parameters:**
- `limit` - Number of items to return
- `offset` - Number of items to skip
- `sort` - Field to sort by
- `order` - Sort direction (`asc` | `desc`)
- `search` - Search term
- `filters` - Field-specific filters

### Custom Routes Documentation

Custom routes are automatically included in the documentation:

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customRoutes: [
    {
      path: "/profile",
      method: "GET",
      auth: { jwtOnly: true },
      registerRoute: async (request, reply) => {
        const auth = (request as any).auth;
        reply.send({ user: auth.user });
      },
    },
    {
      path: "/search",
      method: "GET",
      registerRoute: async (request, reply) => {
        const query = request.query.q as string;
        // Search logic
        reply.send({ results: [] });
      },
    },
  ],
});
```

## Authentication Documentation

When authentication is enabled, Swagger automatically documents:

### Security Schemes

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
```

### Protected Endpoints

Endpoints requiring authentication are marked with security requirements:

```yaml
paths:
  /users:
    get:
      security:
        - BearerAuth: []
        - ApiKeyAuth: []
      responses:
        200:
          description: List of users
        401:
          description: Authentication required
        403:
          description: Insufficient permissions
```

### Authentication Examples

The documentation includes examples for both authentication methods:

**JWT Authentication:**
```bash
curl -H "Authorization: Bearer your-jwt-token" \
     http://localhost:3000/users
```

**API Key Authentication:**
```bash
curl -H "x-api-key: your-api-key" \
     http://localhost:3000/users
```

## Error Documentation

Frey automatically documents standard error responses:

### Validation Errors (400)

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

### Authentication Errors (401/403)

```json
{
  "error": "Authentication required",
  "message": "No authentication token provided"
}
```

### Server Errors (500)

```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Custom Error Documentation

Override default error responses in the documentation:

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customErrors: {
    401: {
      error: "Custom Unauthorized",
      message: "Please provide valid credentials",
    },
    404: {
      error: "User Not Found",
      message: "The requested user does not exist",
    },
  },
  customRoutes: [
    {
      path: "/special",
      method: "GET",
      customErrors: {
        401: {
          error: "Special Auth Required",
          message: "This endpoint requires special authentication",
        },
      },
      registerRoute: async (request, reply) => {
        // Route logic
      },
    },
  ],
});
```

## Advanced Configuration

### Custom Server Information

```typescript
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  host: "api.example.com",
  swagger: {
    title: "My API",
    description: "A comprehensive API for managing users and products",
    version: "2.0.0",
    routePrefix: "/api-docs",
    uiConfig: {
      docExpansion: "list",        // Show operations in list format
      deepLinking: true,           // Enable deep linking to specific operations
    },
  },
});
```

### Multiple Environments

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  swagger: {
    enabled: isDevelopment,        // Only enable in development
    title: "My API - Development",
    description: "Development API documentation",
    routePrefix: "/dev-docs",
  },
});
```

## Testing with Swagger UI

### Interactive Testing

Swagger UI provides an interactive interface for testing your API:

1. **Visit the documentation**: `http://localhost:3000/documentation`
2. **Authenticate**: Click "Authorize" and enter your JWT token or API key
3. **Test endpoints**: Click "Try it out" on any endpoint
4. **View responses**: See real responses from your API

### Example Workflow

1. **Get authentication token**:
   ```bash
   curl -X POST http://localhost:3000/users/login \
        -H "Content-Type: application/json" \
        -d '{"email": "user@example.com", "password": "password"}'
   ```

2. **Use token in Swagger UI**:
   - Click "Authorize" button
   - Enter `Bearer your-jwt-token` in the Bearer field
   - Click "Authorize"

3. **Test protected endpoints**:
   - Try GET `/users` to see the list
   - Try POST `/users` to create a new user
   - Try GET `/users/{id}` to get a specific user

## Production Considerations

### Disable in Production

```typescript
const isProduction = process.env.NODE_ENV === 'production';

startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  swagger: {
    enabled: !isProduction,        // Disable in production
  },
});
```

### Custom Documentation

For production APIs, consider:

1. **Custom documentation site** - Build a separate documentation site
2. **API versioning** - Document different API versions
3. **Rate limiting** - Implement rate limiting for documentation endpoints
4. **Access control** - Restrict documentation access to authorized users

## Troubleshooting

### Common Issues

**Documentation not loading:**
- Check if `swagger.enabled` is `true`
- Verify the `routePrefix` path
- Ensure no route conflicts

**Authentication not working in Swagger UI:**
- Verify JWT token format: `Bearer your-token`
- Check API key header name (default: `x-api-key`)
- Ensure authentication is properly configured

**Schemas not appearing:**
- Verify Zod schemas are properly defined
- Check entity configuration
- Ensure handlers return expected data types

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const fastify = Fastify({ 
  logger: { 
    level: 'debug' 
  } 
});
```

## Best Practices

1. **Keep schemas simple** - Complex nested schemas can be hard to read in documentation
2. **Use descriptive names** - Entity and field names should be self-explanatory
3. **Add examples** - Include example values in your Zod schemas
4. **Document custom routes** - Add comments explaining custom route behavior
5. **Version your API** - Use semantic versioning for API changes
6. **Test documentation** - Regularly test your API using Swagger UI

## Next Steps

- Learn about [Authentication](./authentication.md) for securing your API
- Explore [API Reference](./api-reference.md) for complete documentation
- Check out [Examples](./examples.md) for real-world API patterns
