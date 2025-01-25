# Testing Guidelines - Frey Framework

## Testing Philosophy

### Multi-Runtime Testing
- **Primary**: Node.js with Vitest (comprehensive testing)
- **Secondary**: Bun (performance validation and compatibility)
- **Goal**: Ensure framework works identically on both runtimes

### Test Structure
```
tests/
├── unit/                    # Individual function testing
│   ├── entity.test.ts      # Entity definition tests
│   ├── helpers.test.ts     # Utility type tests
│   └── main.test.ts        # Server setup tests
└── integration/            # End-to-end workflow testing
    ├── server.test.ts      # Server integration tests
    └── params.test.ts      # Parameter passing tests
```

## Unit Testing Patterns

### Entity Testing
```typescript
describe("Entity Definition", () => {
  const mockSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  it("should create a valid entity with all required properties", () => {
    const entity = defineEntity({
      name: "user",
      schema: mockSchema,
      params: {},
      findAll: vi.fn(),
      findOne: vi.fn(),
    });

    expect(entity.name).toBe("user");
    expect(entity.schema).toBe(mockSchema);
    expect(entity.findAll).toBeDefined();
    expect(entity.findOne).toBeDefined();
  });

  it("should execute findAll with correct parameters", async () => {
    const mockFindAll = vi.fn().mockResolvedValue([{ id: "1", name: "John" }]);
    const entity = defineEntity({
      name: "user",
      schema: mockSchema,
      params: {},
      findAll: mockFindAll,
    });

    const context = { request: {} as any, server: {} as any };
    await entity.findAll({}, context);

    expect(mockFindAll).toHaveBeenCalledWith({}, context);
  });
});
```

### Type Testing
```typescript
describe("Helper Types and Utilities", () => {
  it("should work with Zod schemas", () => {
    const schema = z.object({ id: z.string(), name: z.string() });
    type InferredType = PrettyInfer<typeof schema>;
    
    // Type-level test - this should compile without errors
    const testData: InferredType = { id: "1", name: "John" };
    expect(testData.id).toBe("1");
  });

  it("should validate JSON schema correctly", () => {
    const validJson = { id: "1", name: "John", active: true };
    const invalidJson = { id: Symbol("invalid") };

    expect(jsonSchema.parse(validJson)).toEqual(validJson);
    expect(() => jsonSchema.parse(invalidJson)).toThrow();
  });
});
```

## Integration Testing Patterns

### Server Integration
```typescript
describe("Server Integration Tests", () => {
  let fastify: any;
  let server: any;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    server = await startServer(fastify, {
      entities: [testEntity],
    });
  });

  afterEach(async () => {
    await fastify.close();
  });

  it("should register routes for entity with findAll", () => {
    const mockGet = vi.spyOn(fastify, "get");
    expect(mockGet).toHaveBeenCalledWith("/user", expect.any(Function));
  });
});
```

### Parameter Passing Tests
```typescript
describe("Parameter Passing Tests", () => {
  it("should pass query parameters to findAll", async () => {
    const mockGet = vi.spyOn(fastify, "get");
    await startServer(fastify, { entities: [testEntity] });

    const findAllHandler = mockGet.mock.calls.find(
      (call) => call[0] === "/user"
    )?.[1] as any;

    const mockRequest = { query: { filter: "active" } };
    const mockReply = { send: vi.fn() };

    await findAllHandler(mockRequest, mockReply);

    expect(mockReply.send).toHaveBeenCalled();
  });
});
```

## Mocking Strategies

### Fastify Mocking
```typescript
// Mock Fastify instance
const mockFastify = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn().mockResolvedValue(undefined),
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  close: vi.fn().mockResolvedValue(undefined),
} as unknown as FastifyInstance;

// Spy on specific methods
const mockGet = vi.spyOn(fastify, "get");
const mockListen = vi.spyOn(fastify, "listen");
```

### Process Mocking
```typescript
// Mock process.exit to prevent actual exit
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit called");
});

// Test error handling
it("should handle server start error", async () => {
  mockListen.mockRejectedValue(new Error("Port in use"));
  
  await expect(startServer(fastify, { entities: [] })).rejects.toThrow("process.exit called");
  expect(mockExit).toHaveBeenCalledWith(1);
});
```

### Entity Function Mocking
```typescript
// Mock entity functions
const mockEntity = {
  name: "user",
  schema: mockSchema,
  params: {},
  findAll: vi.fn().mockResolvedValue([{ id: "1", name: "John" }]),
  findOne: vi.fn().mockResolvedValue({ id: "1", name: "John" }),
};
```

## Test Data Patterns

### Test Entity Factory
```typescript
const createTestEntity = (overrides: Partial<Entity<any>> = {}): Entity<any> => ({
  name: "test",
  schema: z.object({ id: z.string() }),
  params: {},
  findAll: vi.fn(),
  findOne: vi.fn(),
  ...overrides,
});
```

### Test Data Sets
```typescript
const testUsers = [
  { id: "1", name: "John", email: "john@example.com" },
  { id: "2", name: "Jane", email: "jane@example.com" },
];

const testProducts = [
  { uuid: "prod-1", title: "Widget", price: 99.99 },
  { uuid: "prod-2", title: "Gadget", price: 149.99 },
];
```

## Performance Testing

### Runtime Comparison
```typescript
describe("Runtime Performance", () => {
  it("should complete tests within reasonable time", async () => {
    const startTime = Date.now();
    
    // Run comprehensive test suite
    await runAllTests();
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});
```

### Memory Usage
```typescript
it("should not leak memory during entity operations", async () => {
  const initialMemory = process.memoryUsage();
  
  // Perform multiple entity operations
  for (let i = 0; i < 1000; i++) {
    await entity.findAll({}, context);
  }
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
});
```

## Error Testing

### Error Scenarios
```typescript
describe("Error Handling", () => {
  it("should handle entity function errors gracefully", async () => {
    const errorEntity = createTestEntity({
      findAll: vi.fn().mockRejectedValue(new Error("Database error")),
    });

    const mockRequest = { query: {} };
    const mockReply = { send: vi.fn() };

    const handler = createFindAllHandler(errorEntity);
    
    await expect(handler(mockRequest, mockReply)).rejects.toThrow("Database error");
  });

  it("should validate required entity properties", () => {
    expect(() => {
      defineEntity({
        // Missing required 'name' property
        schema: mockSchema,
        params: {},
        findAll: vi.fn(),
      });
    }).toThrow();
  });
});
```

## Test Organization

### Test Suites
```typescript
// Group related tests
describe("Entity Definition", () => {
  describe("Basic Functionality", () => {
    // Basic tests here
  });
  
  describe("Custom ID Fields", () => {
    // Custom ID tests here
  });
  
  describe("CRUD Operations", () => {
    // CRUD tests here
  });
});
```

### Test Naming
```typescript
// Use descriptive test names
it("should create entity with custom ID field when customId is provided", () => {
  // Test implementation
});

it("should pass complete request object in context to findAll function", () => {
  // Test implementation
});

it("should handle multiple query parameters of same name correctly", () => {
  // Test implementation
});
```

## Coverage Requirements

### Coverage Targets
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

### Coverage Exclusions
```typescript
// Exclude from coverage
// example.ts - Demo file
// tests/** - Test files themselves
// dist/** - Build output
```

## Multi-Runtime Testing

### Node.js Testing (Vitest)
```bash
npm run test:run        # Run all tests
npm run test:coverage   # Run with coverage
npm run test:ui         # Interactive UI
```

### Bun Testing
```bash
bun test               # Run tests with Bun
bun test --coverage    # Run with coverage (if supported)
```

### Runtime-Specific Tests
```typescript
describe("Runtime Compatibility", () => {
  it("should work identically on Node.js and Bun", () => {
    // Test that produces same results on both runtimes
    const result = performEntityOperation();
    expect(result).toBeDefined();
  });
});
```

## Best Practices

### Test Isolation
- Each test should be independent
- Use `beforeEach`/`afterEach` for setup/cleanup
- Mock external dependencies
- Reset mocks between tests

### Test Data
- Use realistic test data
- Avoid hardcoded values when possible
- Create reusable test data factories
- Keep test data minimal but complete

### Assertions
- Use specific assertions (`toBe`, `toEqual`, `toHaveBeenCalledWith`)
- Test both positive and negative cases
- Verify error conditions
- Check side effects (mocks, logs, etc.)

### Performance
- Keep tests fast (< 100ms per test)
- Use parallel execution when possible
- Avoid unnecessary async operations
- Clean up resources properly

## Debugging Tests

### Debug Commands
```bash
# Debug specific test
npm run test -- --reporter=verbose entity.test.ts

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/vitest run

# Debug with Bun
bun test --inspect
```

### Common Issues
- **Import errors**: Ensure `.js` extensions in imports
- **Mock issues**: Reset mocks between tests
- **Async problems**: Use proper async/await patterns
- **Type errors**: Use `as any` for complex mock types
