# TypeScript Patterns - Frey Framework

## Core TypeScript Principles

### Type Safety First
- Prefer explicit types over `any`
- Use Zod schemas for runtime validation
- Leverage TypeScript's type inference where appropriate
- Always use strict mode (`"strict": true`)

### ES Module Patterns
```typescript
// ✅ Correct - Use .js extensions for ES modules
import { defineEntity } from "./entity.js";
import { startServer } from "./main.js";
import { registerFindAllRoute } from "./routes/index.js";

// ❌ Incorrect - Don't use .ts extensions
import { defineEntity } from "./entity.ts";
```

## Advanced Type Patterns

### Utility Types
```typescript
// Prettify utility for cleaner type display
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Generic constraint patterns
export type PrettyInfer<T extends z.ZodType<any, any, any>> = Prettify<z.infer<T>>;

// Conditional types for entity functions
type EntityFunction<T> = T extends { findAll: infer F } ? F : never;
```

### Generic Patterns
```typescript
// Entity with generic schema
export type Entity<Schema extends z.ZodObject<Record<string, z.ZodTypeAny>>> = {
  name: string;
  schema: Schema;
  params: DefaultParams<Schema>;
  customId?: string;
  findAll: (params: Params<Schema>, context: Context) => Promise<PrettyInfer<z.ZodArray<Schema>>>;
  findOne?: (id: string, context: Context) => Promise<PrettyInfer<Schema>>;
  // ... other CRUD operations
};

// Params union type
export type Params<Schema extends z.ZodObject<Record<string, z.ZodTypeAny>>> =
  | DefaultParams<Schema>
  | CustomParams;
```

### Type Guards and Assertions
```typescript
// Type guard for entity functions
function hasFindOne(entity: Entity<any>): entity is Entity<any> & { findOne: Function } {
  return typeof entity.findOne === 'function';
}

// Safe type assertion pattern
const params = z.parse(customIdSchema, request.params) as { [K in string]: string };
```

## Zod Integration Patterns

### Schema Definition
```typescript
// Base schema pattern
const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.date().optional(),
});

// Nested schema pattern
const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })),
  total: z.number().positive(),
});

// Custom validation patterns
const customIdSchema = z.object({
  [entity.customId ?? "id"]: z.string().uuid(),
});
```

### Runtime Validation
```typescript
// Safe parsing with error handling
try {
  const validatedData = schema.parse(inputData);
  return validatedData;
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
  }
  throw error;
}

// Optional validation pattern
const result = schema.safeParse(inputData);
if (!result.success) {
  // Handle validation errors
  return { error: result.error.errors };
}
```

## Context and Parameter Patterns

### Context Type Safety
```typescript
export type Context = {
  request: FastifyRequest;
  server: FastifyInstance;
};

// Context usage pattern
const processEntity = async (params: Params<Schema>, context: Context) => {
  const { request, server } = context;
  // Use request and server with full type safety
};
```

### Parameter Handling
```typescript
// Query parameters (findAll)
const params = request.query as Params<Schema>;

// Path parameters (findOne, update, delete)
const pathParams = z.parse(customIdSchema, request.params);
const id = pathParams[entity.customId ?? "id"];

// Body parameters (create, update)
const bodyData = request.body as Partial<z.infer<Schema>>;
```

## Error Handling Patterns

### Typed Error Responses
```typescript
// Error response type
type ErrorResponse = {
  error: string;
  code?: string;
  details?: unknown;
};

// Error handling pattern
const handleEntityError = (error: unknown): ErrorResponse => {
  if (error instanceof z.ZodError) {
    return {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors,
    };
  }
  
  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'ENTITY_ERROR',
    };
  }
  
  return {
    error: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
};
```

## Advanced TypeScript Features

### Mapped Types
```typescript
// Create optional version of entity
type OptionalEntity<T> = {
  [K in keyof T]?: T[K];
};

// Extract function signatures
type ExtractFunction<T, K extends keyof T> = T[K] extends Function ? T[K] : never;
```

### Template Literal Types
```typescript
// Route path generation
type RoutePath<T extends string> = `/${T}` | `/${T}/:${string}`;

// Entity route patterns
type EntityRoutes<T extends string> = {
  findAll: RoutePath<T>;
  findOne: `${RoutePath<T>}/:id`;
  create: RoutePath<T>;
  update: `${RoutePath<T>}/:id`;
  delete: `${RoutePath<T>}/:id`;
};
```

### Conditional Types
```typescript
// Conditional entity function types
type EntityFunction<T, K extends keyof T> = T[K] extends Function 
  ? T[K] 
  : never;

// Optional vs required functions
type RequiredEntityFunctions = 'name' | 'schema' | 'params' | 'findAll';
type OptionalEntityFunctions = 'findOne' | 'create' | 'update' | 'delete';
```

## Performance Optimization Patterns

### Type-Only Imports
```typescript
// Import only types when possible
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Entity } from "./entity.js";

// Separate type and value imports
import { z } from "zod";
import type { z as ZodType } from "zod";
```

### Lazy Type Evaluation
```typescript
// Use lazy evaluation for recursive types
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
);
```

## Testing Type Patterns

### Mock Type Safety
```typescript
// Typed mock functions
const mockFindAll = vi.fn() as jest.MockedFunction<Entity<any>['findAll']>;
const mockFastify = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
} as unknown as FastifyInstance;
```

### Test Type Utilities
```typescript
// Test entity factory
const createTestEntity = <T extends z.ZodObject<any>>(
  name: string,
  schema: T
): Entity<T> => ({
  name,
  schema,
  params: {},
  findAll: vi.fn(),
  findOne: vi.fn(),
});
```

## Best Practices

### Type Organization
- Keep complex types in dedicated files
- Use barrel exports for clean imports
- Group related types together
- Document complex type utilities

### Type Documentation
```typescript
/**
 * Represents a Frey entity with CRUD operations
 * @template Schema - Zod schema type for validation
 */
export type Entity<Schema extends z.ZodObject<Record<string, z.ZodTypeAny>>> = {
  /** Entity name used for route generation */
  name: string;
  /** Zod schema for validation and type inference */
  schema: Schema;
  /** Default parameters for entity operations */
  params: DefaultParams<Schema>;
  /** Custom ID field name (defaults to 'id') */
  customId?: string;
  // ... rest of properties
};
```

### Type Safety Checklist
- [ ] All imports use `.js` extensions
- [ ] No `any` types without justification
- [ ] Zod schemas for runtime validation
- [ ] Proper error handling with typed responses
- [ ] Context objects properly typed
- [ ] Generic constraints properly defined
- [ ] Type-only imports where possible
