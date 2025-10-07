---
title: Authentication
description: Secure your APIs with JWT and API key authentication
order: 5
---

# Authentication

Frey provides comprehensive authentication support with JWT tokens and API keys, featuring secure-by-default behavior and flexible per-route configuration.

## Overview

When authentication is enabled globally, all routes require authentication by default. Individual routes can opt-out by setting `requireAuth: false`. This secure-by-default approach ensures your API is protected unless explicitly made public.

## Quick Start

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "frey";
import jwt from "jsonwebtoken";

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
    // auth.user is available when authenticated
    return [{ id: "1", name: "John", email: "john@example.com", role: "user" }];
  },
  customRoutes: [
    {
      path: "/public",
      method: "GET",
      auth: { requireAuth: false }, // Opt-out of authentication
      registerRoute: async (request, reply) => {
        reply.send({ message: "This is public" });
      },
    },
  ],
});

const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  auth: {
    enabled: true,
    jwt: {
      secret: "your-secret-key",
      expiresIn: "1h",
    },
  },
});
```

## Configuration

### Global Authentication

Configure authentication in the `startServer` options:

```typescript
startServer(fastify, {
  entities: [userEntity],
  auth: {
    enabled: true,                    // Enable authentication globally
    jwt: {                           // JWT configuration
      secret: "your-secret-key",
      expiresIn: "1h",
      issuer: "your-app",
      audience: "your-users",
      extractUser: async (decoded) => {
        // Custom user extraction logic
        return {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        };
      },
    },
    apiKey: {                        // API key configuration
      headerName: "x-api-key",       // Default: "x-api-key"
      validateKey: async (key) => {
        // Validate API key and return user
        if (key === "valid-key") {
          return {
            id: "api-user",
            email: "api@example.com",
            name: "API User",
            role: "user",
          };
        }
        return null;
      },
    },
  },
});
```

### JWT Configuration

```typescript
type JwtConfig = {
  secret: string;                    // JWT signing secret
  expiresIn?: string;                // Token expiration (default: "1h")
  issuer?: string;                   // JWT issuer
  audience?: string;                 // JWT audience
  extractUser?: (decoded: any) => Promise<User | null>;
};
```

### API Key Configuration

```typescript
type ApiKeyConfig = {
  headerName?: string;               // Header name (default: "x-api-key")
  validateKey: (key: string) => Promise<User | null>;
};
```

## User Context

Authenticated user information is automatically injected into all route handlers:

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, { auth }) => {
    // auth.user contains the authenticated user
    console.log("Authenticated user:", auth.user);
    
    // auth.isAuthenticated indicates if user is authenticated
    if (!auth.isAuthenticated) {
      throw new Error("Authentication required");
    }
    
    return await database.users.findMany({
      where: { createdBy: auth.user.id }
    });
  },
});
```

### Auth Context Type

```typescript
type AuthContext = {
  user?: User;                       // Authenticated user (if any)
  isAuthenticated: boolean;          // Authentication status
  token?: string;                    // JWT token (if JWT auth)
  apiKey?: string;                   // API key (if API key auth)
  authMethod?: 'jwt' | 'api-key';   // Authentication method used
};

type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
};
```

## Route-Level Authentication

### Entity-Level Configuration

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  auth: {
    requireAuth: false,              // Opt-out of authentication for this entity
    jwtOnly: true,                   // Require JWT authentication only
    apiKeyOnly: true,                // Require API key authentication only
    customAuth: async (request) => { // Custom authentication logic
      const customToken = request.headers['x-custom-token'];
      return customToken === 'valid-custom-token';
    },
  },
  findAll: async (params, { auth }) => {
    // Handler logic
  },
});
```

### Custom Route Configuration

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customRoutes: [
    {
      path: "/profile",
      method: "GET",
      auth: {
        requireAuth: true,           // Require authentication (default when auth.enabled)
        jwtOnly: true,                // JWT authentication only
      },
      registerRoute: async (request, reply) => {
        const auth = (request as any).auth;
        reply.send({ user: auth.user });
      },
    },
    {
      path: "/public",
      method: "GET",
      auth: {
        requireAuth: false,          // Opt-out of authentication
      },
      registerRoute: async (request, reply) => {
        reply.send({ message: "Public endpoint" });
      },
    },
    {
      path: "/admin",
      method: "GET",
      auth: {
        customAuth: async (request) => {
          const auth = (request as any).auth;
          return auth.user?.role === 'admin';
        },
      },
      registerRoute: async (request, reply) => {
        reply.send({ message: "Admin only" });
      },
    },
  ],
});
```

## Authentication Methods

### JWT Authentication

JWT tokens are sent in the `Authorization` header:

```bash
curl -H "Authorization: Bearer your-jwt-token" \
     http://localhost:3000/users
```

**Token Structure:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### API Key Authentication

API keys are sent in a custom header (default: `x-api-key`):

```bash
curl -H "x-api-key: your-api-key" \
     http://localhost:3000/users
```

## Error Responses

Frey provides standardized authentication error responses:

### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "message": "No authentication token provided"
}
```

### 403 Forbidden

```json
{
  "error": "Authentication method not allowed",
  "message": "This endpoint only accepts JWT authentication"
}
```

## Custom Error Handling

Override default error responses per route:

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customErrors: {
    401: {
      error: "Custom Unauthorized",
      message: "Please provide valid credentials",
    },
    403: {
      error: "Access Denied",
      message: "Insufficient permissions for this operation",
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

## Complete Example

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "frey";
import jwt from "jsonwebtoken";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
});

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
      path: "/public",
      method: "GET",
      auth: { requireAuth: false },
      registerRoute: async (request, reply) => {
        reply.send({ message: "Public endpoint" });
      },
    },
  ],
  findAll: async (params, { auth }) => {
    if (!auth.isAuthenticated) {
      throw new Error("Authentication required");
    }
    return [{ id: "1", name: "John", email: "john@example.com", role: "user" }];
  },
});

const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  auth: {
    enabled: true,
    jwt: {
      secret: "your-secret-key",
      expiresIn: "1h",
      extractUser: async (decoded) => ({
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      }),
    },
    apiKey: {
      validateKey: async (key) => {
        if (key === "valid-api-key") {
          return {
            id: "api-user",
            email: "api@example.com",
            name: "API User",
            role: "user",
          };
        }
        return null;
      },
    },
  },
});
```

## Testing Authentication

```typescript
import jwt from "jsonwebtoken";

// Generate test JWT token
const token = jwt.sign(
  { sub: "123", email: "test@example.com", role: "user" },
  "your-secret-key",
  { expiresIn: "1h" }
);

// Test authenticated endpoint
const response = await fetch("http://localhost:3000/users", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Test API key endpoint
const response2 = await fetch("http://localhost:3000/users", {
  headers: {
    "x-api-key": "valid-api-key",
  },
});

// Test public endpoint
const response3 = await fetch("http://localhost:3000/users/public");
```

## Best Practices

1. **Use HTTPS in production** - Never send tokens over unencrypted connections
2. **Rotate secrets regularly** - Change JWT secrets and API keys periodically
3. **Validate tokens server-side** - Always verify tokens on the server
4. **Use short expiration times** - Set reasonable token expiration times
5. **Implement token refresh** - Provide a way to refresh expired tokens
6. **Log authentication events** - Monitor authentication attempts and failures
7. **Use environment variables** - Store secrets in environment variables, not code

## Security Considerations

- **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended for web apps)
- **Secret Management**: Use strong, random secrets and rotate them regularly
- **Rate Limiting**: Implement rate limiting to prevent brute force attacks
- **Input Validation**: Always validate and sanitize user input
- **Error Messages**: Don't leak sensitive information in error messages
- **Audit Logging**: Log authentication events for security monitoring

## Next Steps

- Learn about [Getting Started](./getting-started.md) for basic usage
- Explore [Entity Configuration](./entity-configuration.md) for advanced options
- Check out [Examples](./examples.md) for real-world authentication patterns
- Review [API Reference](./api-reference.md) for complete documentation
