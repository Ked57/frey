# Frey Framework - Cursor Rules

## Project Overview
Frey is a Fastify-based framework that automatically generates REST API routes from entity definitions. It supports multiple JavaScript runtimes (Node.js, Bun) and emphasizes type safety with Zod schemas.

## Architecture Principles

### Core Philosophy
- **Entity-Driven**: APIs are generated from entity definitions, not manual route creation
- **Type Safety**: Use Zod schemas for validation and TypeScript for type inference
- **Runtime Agnostic**: Support both Node.js and Bun without code changes
- **Modular Design**: Separate CRUD operations into individual files for clarity

### File Structure
```
src/
├── main.ts              # Server setup and entity registration
├── entity.ts            # Entity definition and types
├── helpers.ts           # Utility types and schemas
└── routes/              # CRUD operation modules
    ├── index.ts         # Route exports
    ├── findAll.ts       # GET /entity
    ├── findOne.ts       # GET /entity/:id
    ├── create.ts        # POST /entity
    ├── update.ts        # PUT /entity/:id
    └── delete.ts        # DELETE /entity/:id
```

## Code Standards

### TypeScript & ES Modules
- Use `.js` extensions in imports (required for ES modules)
- Always use `"type": "module"` in package.json
- Prefer explicit types over `any` when possible
- Use `Prettify<T>` utility type for cleaner type inference

### Import Conventions
```typescript
// ✅ Correct - Use .js extensions
import { defineEntity } from "./entity.js";
import { startServer } from "./main.js";

// ❌ Incorrect - Don't use .ts extensions
import { defineEntity } from "./entity.ts";
```

### Entity Definition Pattern
```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  params: {}, // Possible param field
  customId: "uuid", // Optional custom ID field
  findAll: async (params, context) => { /* ... */ },
  findOne: async (id, context) => { /* ... */ },
  create: async (params, context) => { /* ... */ }, // Optional
  update: async (params, context) => { /* ... */ }, // Optional
  delete: async (params, context) => { /* ... */ }, // Optional
});
```

### Route Registration Pattern
- Each CRUD operation should be in its own file
- Use descriptive function names: `registerFindAllRoute`, `registerCreateRoute`
- Always check if entity function exists before registering route
- Use appropriate log levels: `error` for missing required functions, `warn` for optional ones

### Context Passing
- Always pass `{ request, server }` context to entity functions
- Use `request.query` for findAll parameters
- Use `request.params` for findOne/update/delete ID parameters
- Use `request.body` for create/update data

### Error Handling
- Use Fastify's built-in logging: `server.log.error()`, `server.log.warn()`
- Gracefully handle missing entity functions
- Use `process.exit(1)` for critical server startup failures

## Testing Standards

### Test Structure
- Unit tests: `tests/unit/` - Test individual functions and types
- Integration tests: `tests/integration/` - Test complete workflows
- Use Vitest for Node.js, Bun's built-in test runner for Bun

### Test Patterns
```typescript
// ✅ Good - Test entity structure and function execution
describe("Entity Definition", () => {
  it("should create a valid entity with all required properties", () => {
    const entity = defineEntity({ /* ... */ });
    expect(entity.name).toBe("user");
    expect(entity.findAll).toBeDefined();
  });
});

// ✅ Good - Test parameter passing and context injection
it("should pass query parameters to findAll", async () => {
  const mockGet = vi.spyOn(fastify, "get");
  await startServer(fastify, { entities: [testEntity] });
  // Verify route registration and parameter passing
});
```

### Mocking Guidelines
- Use `vi.spyOn()` for Fastify methods
- Mock `process.exit` to prevent actual exit during tests
- Use `as any` type assertions when extracting handlers from mock calls

## CI/CD Standards

### Multi-Runtime Testing
- Test on both Node.js and Bun
- Use matrix strategy for different Node.js versions (18, 20, 21)
- Test on multiple OS: ubuntu-latest, macos-latest, windows-latest

### Quality Gates
- All tests must pass
- Prettier formatting must be consistent
- TypeScript strict mode must pass
- No security vulnerabilities (npm audit)

### Workflow Structure
```yaml
# Main CI pipeline
- linting: Prettier + TypeScript checks
- testing: Vitest with coverage
- matrix-testing: Multiple Node.js versions + OS
- runtime-testing: Node.js + Bun compatibility
- security-check: Audit + CodeQL
```

## Development Guidelines

### Adding New Features
1. **Entity Functions**: Add to entity definition, create corresponding route file
2. **Route Handlers**: Create new file in `src/routes/`, export from `index.ts`
3. **Types**: Add to appropriate file (`entity.ts` for entity types, `helpers.ts` for utilities)
4. **Tests**: Add unit tests for new functions, integration tests for workflows

### Code Organization
- Keep `main.ts` focused on server setup and entity registration
- Separate concerns: each CRUD operation in its own file
- Use barrel exports (`index.ts`) for clean imports
- Maintain backward compatibility when possible

### Performance Considerations
- Bun is ~3x faster than Node.js for tests
- Use NodeJS for development when possible, it has wider use
- Optimize for both runtimes equally

## Security & Dependencies

### Dependency Management
- Use `npm audit` to check for vulnerabilities
- Keep dependencies up to date with `npm-check-updates`
- Use `audit-ci` for CI security checks
- Prefer stable, well-maintained packages

### Package Versions
- Use exact versions for critical dependencies
- Use caret ranges for development dependencies
- Regular security updates via Dependabot

## Documentation Standards

### Code Comments
- Document complex type utilities and helper functions
- Explain non-obvious business logic
- Use JSDoc for public API functions

### README Updates
- Keep installation instructions current
- Document new features and breaking changes
- Include examples for new functionality

## Common Patterns to Follow

### Entity Function Signatures
```typescript
// Standard patterns
findAll: (params: Params<Schema>, context: Context) => Promise<PrettyInfer<z.ZodArray<Schema>>>
findOne: (id: string, context: Context) => Promise<PrettyInfer<Schema>>
create: (params: Params<Schema>, context: Context) => Promise<PrettyInfer<Schema>>
update: (params: Params<Schema>, context: Context) => Promise<PrettyInfer<Schema>>
delete: (params: Params<Schema>, context: Context) => Promise<void>
```

### Route Handler Patterns
```typescript
// Standard route handler structure
server.get(`/${entity.name}`, async (request, reply) => {
  const params = request.query;
  const result = await entity.findAll(params as any, { request, server });
  reply.send(result);
});
```

### Error Handling Patterns
```typescript
// Check for required functions
if (!entity.findOne) {
  server.log.error(`Entity ${entity.name} does not have a findOne function`);
  return;
}

// Check for optional functions
if (!entity.create) {
  server.log.warn(`Entity ${entity.name} does not have a create function - skipping POST route`);
  return;
}
```

## Future Development Guidelines

### Phase 2 Features (Authentication, Validation, Caching)
- Maintain the modular route structure
- Add middleware support to route handlers
- Keep entity definitions clean and focused
- Ensure multi-runtime compatibility

### Breaking Changes
- Update major version for breaking changes
- Maintain backward compatibility when possible
- Update all tests and documentation
- Consider migration guides for major changes

Remember: The goal is to maintain a clean, type-safe, multi-runtime framework that makes API development simple and consistent.
