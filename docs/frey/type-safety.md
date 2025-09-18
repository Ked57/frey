---
title: Type Safety
description: Leverage TypeScript and Zod for end-to-end type safety in your APIs
order: 5
---

# Type Safety

Frey is built with TypeScript and leverages Zod for end-to-end type safety. This ensures that your API is type-safe from schema definition to runtime validation.

## Schema-Driven Types

When you define a Zod schema, Frey automatically infers TypeScript types:

```typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  isActive: z.boolean(),
  createdAt: z.date(),
  tags: z.array(z.string()).optional(),
});

// TypeScript automatically infers this type:
type User = z.infer<typeof userSchema>;
// {
//   id: string;
//   name: string;
//   email: string;
//   age: number;
//   isActive: boolean;
//   createdAt: Date;
//   tags?: string[] | undefined;
// }
```

## Handler Type Safety

Your entity handlers are fully type-safe:

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, { request, server }) => {
    // params is typed based on query parameters
    // Return type is inferred from your return statement
    const users: User[] = await database.users.findMany();
    return users; // TypeScript knows this is User[]
  },
  findOne: async (param, { request, server }) => {
    // param.id is typed as string
    const user: User | null = await database.users.findUnique({
      where: { id: param.id }
    });
    return user; // TypeScript knows this is User | null
  },
  create: async (params, { request, server }) => {
    // params is typed as User (without id and createdAt)
    const user: User = await database.users.create({
      data: params
    });
    return user; // TypeScript knows this is User
  },
});
```

## Context Type Safety

The context object passed to handlers is fully typed:

```typescript
type Context = {
  request: FastifyRequest;     // Fastify request object
  server: FastifyInstance;     // Fastify server instance
  entity: Entity<UserSchema>;  // Your entity definition
};

findAll: async (params, context: Context) => {
  // context.request is typed as FastifyRequest
  // context.server is typed as FastifyInstance
  // context.entity is typed with your schema
}
```

## Custom Route Type Safety

Custom routes also benefit from type safety:

```typescript
customRoutes: [
  {
    path: "/search",
    method: "GET",
    registerRoute: async (request: FastifyRequest, reply: FastifyReply, { server, entity }) => {
      // request and reply are fully typed
      const query = request.query.q as string;
      const limit = parseInt(request.query.limit as string) || 10;
      
      // Your custom logic here
      reply.send({ results: [], query, limit });
    },
  },
]
```

## Advanced Type Patterns

### Conditional Types

Use TypeScript's conditional types for advanced scenarios:

```typescript
type CreateUserInput = Omit<User, 'id' | 'createdAt'>;
type UpdateUserInput = Partial<CreateUserInput>;

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  create: async (params: CreateUserInput, { request, server }) => {
    // params is typed as CreateUserInput
    return await database.users.create({ data: params });
  },
  update: async (params: { id: string; data: UpdateUserInput }, { request, server }) => {
    // params is typed with custom structure
    return await database.users.update({
      where: { id: params.id },
      data: params.data
    });
  },
});
```

### Generic Entity Types

Create reusable entity types:

```typescript
type BaseEntity<T> = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
} & T;

type UserEntity = BaseEntity<{
  name: string;
  email: string;
  age: number;
}>;

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

### Union Types

Use union types for flexible schemas:

```typescript
const productSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("book"),
    title: z.string(),
    author: z.string(),
    pages: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("electronics"),
    name: z.string(),
    brand: z.string(),
    warranty: z.number().int().positive(),
  }),
]);

type Product = z.infer<typeof productSchema>;
// Product is a union type: Book | Electronics
```

## Runtime Validation

Zod schemas provide runtime validation in addition to compile-time type safety:

```typescript
const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});

// This will throw an error at runtime if validation fails
const user = userSchema.parse({
  id: "123",
  name: "John Doe",
  email: "john@example.com",
  age: 25,
});

// Safe parsing that returns a result
const result = userSchema.safeParse({
  id: "123",
  name: "", // This will fail validation
  email: "invalid-email",
  age: -5, // This will fail validation
});

if (!result.success) {
  console.log(result.error.issues);
  // [
  //   { path: ['name'], message: 'String must contain at least 1 character(s)' },
  //   { path: ['email'], message: 'Invalid email' },
  //   { path: ['age'], message: 'Number must be greater than or equal to 0' }
  // ]
}
```

## Error Handling with Types

Handle errors in a type-safe way:

```typescript
import { ZodError } from "zod";

create: async (params, { request, server }) => {
  try {
    const user = await database.users.create({ data: params });
    return user;
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      throw new Error(`Validation failed: ${error.message}`);
    }
    
    // Handle other errors
    throw new Error("Failed to create user");
  }
}
```

## Type Guards

Use type guards for runtime type checking:

```typescript
function isUser(obj: any): obj is User {
  return userSchema.safeParse(obj).success;
}

findOne: async (param, { request, server }) => {
  const user = await database.users.findUnique({
    where: { id: param.id }
  });
  
  if (!user || !isUser(user)) {
    throw new Error("User not found or invalid");
  }
  
  return user; // TypeScript knows this is User
}
```

## Best Practices

1. **Use strict TypeScript**: Enable strict mode in your TypeScript configuration
2. **Leverage Zod inference**: Let Zod infer types instead of manually defining them
3. **Validate at boundaries**: Validate data at API boundaries (request/response)
4. **Use type guards**: Implement type guards for runtime type checking
5. **Handle errors gracefully**: Always handle potential type errors
6. **Document complex types**: Add JSDoc comments for complex type definitions

## TypeScript Configuration

Recommended TypeScript configuration for Frey projects:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Common Type Patterns

### API Response Types

```typescript
type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

findAll: async (params, { request, server }) => {
  const users = await database.users.findMany();
  const total = await database.users.count();
  
  const response: PaginatedResponse<User> = {
    data: users,
    success: true,
    pagination: {
      limit: params.limit || 10,
      offset: params.offset || 0,
      total,
      hasMore: (params.offset || 0) + users.length < total
    }
  };
  
  return response;
}
```

### Error Types

```typescript
type ApiError = {
  error: string;
  message: string;
  code?: string;
  details?: any;
};

type ValidationError = ApiError & {
  code: "VALIDATION_ERROR";
  details: ZodError;
};
```

## Next Steps

- Learn about [Parameter Handling](./parameter-handling.md) for advanced querying
- Explore [Custom Routes](./custom-routes.md) for advanced functionality
- Check out [Examples](./examples.md) for real-world implementations
