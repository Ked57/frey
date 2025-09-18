---
title: Custom Routes
description: Extend your entities with custom route handlers for specific business logic
order: 3
---

# Custom Routes

While Frey automatically generates CRUD endpoints for your entities, you can extend them with custom routes to handle specific business logic.

## Adding Custom Routes

Use the `customRoutes` property to add custom endpoints to your entity:

```typescript
import { defineEntity } from "frey";
import { z } from "zod";

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
  ],
  findAll: async (...) => {...},
});
```

This creates a new endpoint: `GET /users/stats`

## Custom Route Structure

```typescript
type CustomRoute = {
  path: string;                    // Route path (relative to entity)
  method: HTTPMethod;             // HTTP method
  registerRoute: RouteHandler;    // Handler function
};

type HTTPMethod = 
  | "GET" 
  | "POST" 
  | "PUT" 
  | "DELETE" 
  | "PATCH" 
  | "HEAD" 
  | "OPTIONS";

type RouteHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
  context: { server: FastifyInstance; entity: Entity }
) => Promise<void> | void;
```

## Route Handler Context

Custom route handlers receive the same context as CRUD handlers:

```typescript
registerRoute: async (request, reply, { server, entity }) => {
  // request: Fastify request object
  // reply: Fastify reply object
  // server: Fastify server instance
  // entity: The entity definition
}
```

## Common Use Cases

### Search Endpoints

```typescript
customRoutes: [
  {
    path: "/search",
    method: "GET",
    registerRoute: async (request, reply, { server, entity }) => {
      const query = request.query.q as string;
      const limit = parseInt(request.query.limit as string) || 10;
      
      const users = await database.users.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
        take: limit,
      });
      
      reply.send({ results: users, query, limit });
    },
  },
]
```

### Bulk Operations

```typescript
customRoutes: [
  {
    path: "/bulk-delete",
    method: "POST",
    registerRoute: async (request, reply, { server, entity }) => {
      const { ids } = request.body as { ids: string[] };
      
      const result = await database.users.deleteMany({
        where: { id: { in: ids } }
      });
      
      reply.send({ 
        deletedCount: result.count,
        message: `Deleted ${result.count} users`
      });
    },
  },
]
```

### File Upload

```typescript
customRoutes: [
  {
    path: "/upload-avatar",
    method: "POST",
    registerRoute: async (request, reply, { server, entity }) => {
      const data = await request.file();
      
      if (!data) {
        reply.code(400).send({ error: "No file uploaded" });
        return;
      }
      
      // Process file upload
      const avatarUrl = await uploadFile(data);
      
      reply.send({ avatarUrl });
    },
  },
]
```

### Authentication & Authorization

```typescript
customRoutes: [
  {
    path: "/profile",
    method: "GET",
    registerRoute: async (request, reply, { server, entity }) => {
      const userId = request.headers['x-user-id'] as string;
      
      if (!userId) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }
      
      const user = await database.users.findUnique({
        where: { id: userId }
      });
      
      reply.send(user);
    },
  },
]
```

## Advanced Patterns

### Nested Resources

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customRoutes: [
    {
      path: "/:userId/posts",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const userId = request.params.userId as string;
        
        const posts = await database.posts.findMany({
          where: { userId }
        });
        
        reply.send(posts);
      },
    },
  ],
  findAll: async (...) => {...},
});
```

### Middleware Integration

```typescript
customRoutes: [
  {
    path: "/admin-only",
    method: "GET",
    registerRoute: async (request, reply, { server, entity }) => {
      // Check admin role
      const userRole = request.headers['x-user-role'] as string;
      
      if (userRole !== 'admin') {
        reply.code(403).send({ error: "Admin access required" });
        return;
      }
      
      // Admin-only logic here
      reply.send({ message: "Admin access granted" });
    },
  },
]
```

### Response Transformation

```typescript
customRoutes: [
  {
    path: "/export",
    method: "GET",
    registerRoute: async (request, reply, { server, entity }) => {
      const users = await database.users.findMany();
      
      // Transform data for export
      const exportData = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        // Exclude sensitive fields
      }));
      
      reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', 'attachment; filename="users.json"')
        .send(exportData);
    },
  },
]
```

## Error Handling

Always handle errors gracefully in custom routes:

```typescript
customRoutes: [
  {
    path: "/risky-operation",
    method: "POST",
    registerRoute: async (request, reply, { server, entity }) => {
      try {
        // Risky operation
        const result = await performRiskyOperation();
        reply.send(result);
      } catch (error) {
        server.log.error(error);
        reply.code(500).send({ 
          error: "Internal server error",
          message: "Something went wrong"
        });
      }
    },
  },
]
```

## Route Ordering

Custom routes are registered in the order they appear in the array. Be careful with route conflicts:

```typescript
customRoutes: [
  {
    path: "/:id",  // This will match /users/123
    method: "GET",
    registerRoute: async (request, reply, { server, entity }) => {
      // This will override the default findOne route
    },
  },
  {
    path: "/stats",  // This will match /users/stats
    method: "GET",
    registerRoute: async (request, reply, { server, entity }) => {
      // This is safe - no conflict
    },
  },
]
```

## Best Practices

1. **Use descriptive paths**: Choose clear, RESTful paths for your custom routes
2. **Handle errors**: Always include proper error handling
3. **Validate input**: Validate request parameters and body data
4. **Use appropriate HTTP methods**: Follow REST conventions
5. **Keep handlers focused**: Each custom route should have a single responsibility
6. **Document your routes**: Consider adding OpenAPI documentation for custom routes

## Next Steps

- Learn about [Parameter Handling](./parameter-handling.md) for advanced querying
- Explore [Type Safety](./type-safety.md) for better development experience
- Check out [Examples](./examples.md) for more real-world use cases
