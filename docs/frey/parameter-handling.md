---
title: Parameter Handling
description: Understand how Frey handles query parameters, request bodies, and URL parameters
order: 4
---

# Parameter Handling

Frey automatically parses and validates query parameters, request bodies, and URL parameters for your entity endpoints.

## Query Parameters

Query parameters are automatically parsed and made available to your handlers through the `params` object.

### Supported Query Parameters

Frey supports several built-in query parameters:

- `limit` - Number of items to return (pagination)
- `offset` - Number of items to skip (pagination)
- `sort` - Field to sort by
- `order` - Sort direction (`asc` or `desc`)
- `search` - Search term for text fields
- **Field filters** - Any field from your entity schema can be used as a query parameter

### Basic Usage

```typescript
findAll: async (params, { request, server }) => {
  console.log(params);
  // {
  //   limit: 10,
  //   offset: 0,
  //   sort: 'name',
  //   order: 'asc',
  //   search: 'john',
  //   isActive: true,
  //   age: 25
  // }
  
  // Field filters are passed directly as key-value pairs
  // Remove built-in parameters to get only field filters
  const { limit, offset, sort, order, search, ...fieldFilters } = params;
  
  const users = await database.users.findMany({
    take: params.limit,
    skip: params.offset,
    orderBy: { [params.sort]: params.order },
    where: {
      AND: [
        params.search ? {
          OR: [
            { name: { contains: params.search } },
            { email: { contains: params.search } }
          ]
        } : {},
        fieldFilters  // Use field filters directly
      ]
    }
  });
  
  return users;
}
```

### Example Requests

```bash
# Basic pagination
GET /users?limit=10&offset=20

# Sorting
GET /users?sort=name&order=desc

# Search
GET /users?search=john

# Field filters
GET /users?isActive=true&age=25

# Combined
GET /users?limit=5&offset=0&sort=createdAt&order=desc&search=admin&isActive=true
```

## URL Parameters

URL parameters (like `:id`) are automatically extracted and available in handlers:

```typescript
findOne: async (param, { request, server }) => {
  console.log(param.id); // The ID from /users/:id
  
  const user = await database.users.findUnique({
    where: { id: param.id }
  });
  
  return user;
}
```

## Request Body

For `POST` and `PUT` requests, the request body is automatically validated against your entity schema:

```typescript
create: async (params, { request, server }) => {
  // params contains the validated request body
  console.log(params); // { name: "John", email: "john@example.com", ... }
  
  const user = await database.users.create({
    data: params
  });
  
  return user;
}
```

## Advanced Parameter Parsing

### Custom Parameter Types

You can define custom parameter parsing by extending the built-in types:

```typescript
// In your entity definition
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, { request, server }) => {
    // Access raw query parameters
    const rawQuery = request.query;
    
    // Custom parsing logic
    const customFilters = parseCustomFilters(rawQuery);
    
    const users = await database.users.findMany({
      where: {
        ...params.filters,
        ...customFilters
      }
    });
    
    return users;
  },
});
```

### Date Range Filtering

```typescript
findAll: async (params, { request, server }) => {
  const { startDate, endDate } = request.query;
  
  const whereClause = {
    ...params.filters,
  };
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }
  
  const users = await database.users.findMany({
    where: whereClause
  });
  
  return users;
}
```

### Array Parameters

Handle array parameters in query strings:

```typescript
findAll: async (params, { request, server }) => {
  const { tags } = request.query;
  
  const whereClause = {
    ...params.filters,
  };
  
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    whereClause.tags = { hasSome: tagArray };
  }
  
  const users = await database.users.findMany({
    where: whereClause
  });
  
  return users;
}
```

## Validation and Error Handling

### Automatic Validation

Frey automatically validates parameters against your Zod schema:

```typescript
const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});

// If request body doesn't match schema, Frey returns 400 error automatically
create: async (params, { request, server }) => {
  // params is guaranteed to match userSchema
  return await database.users.create({ data: params });
}
```

### Custom Validation

Add custom validation logic in your handlers:

```typescript
create: async (params, { request, server }) => {
  // Additional business logic validation
  if (params.age < 18 && params.role === 'admin') {
    throw new Error('Minors cannot be admins');
  }
  
  // Check for duplicate email
  const existingUser = await database.users.findUnique({
    where: { email: params.email }
  });
  
  if (existingUser) {
    throw new Error('Email already exists');
  }
  
  return await database.users.create({ data: params });
}
```

## Parameter Types Reference

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | number | Items per page | `?limit=10` |
| `offset` | number | Items to skip | `?offset=20` |
| `sort` | string | Sort field | `?sort=name` |
| `order` | 'asc' \| 'desc' | Sort direction | `?order=desc` |
| `search` | string | Search term | `?search=john` |
| **Field filters** | any | Direct field filtering | `?isActive=true&age=25` |

### URL Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | string | Entity ID | `/users/123` |

### Request Body

The request body is validated against your entity schema and passed as the `params` object.

## Best Practices

1. **Use built-in parameters**: Leverage Frey's built-in parameter parsing when possible
2. **Validate early**: Let Zod handle basic validation, add business logic validation in handlers
3. **Handle errors gracefully**: Always handle potential errors in your handlers
4. **Document your parameters**: Consider documenting custom parameters for API consumers
5. **Use appropriate types**: Choose the right parameter types for your use case

## Common Patterns

### Pagination

```typescript
findAll: async (params, { request, server }) => {
  const users = await database.users.findMany({
    take: params.limit || 10,
    skip: params.offset || 0,
  });
  
  const total = await database.users.count();
  
  return {
    data: users,
    pagination: {
      limit: params.limit || 10,
      offset: params.offset || 0,
      total,
      hasMore: (params.offset || 0) + users.length < total
    }
  };
}
```

### Search with Highlighting

```typescript
findAll: async (params, { request, server }) => {
  const users = await database.users.findMany({
    where: params.search ? {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } }
      ]
    } : {},
    take: params.limit,
    skip: params.offset,
  });
  
  return users;
}
```

### Complex Filtering

```typescript
findAll: async (params, { request, server }) => {
  // Extract built-in parameters
  const { limit, offset, sort, order, search, ...fieldFilters } = params;
  
  const whereClause: any = {};
  
  // Add field filters directly
  Object.entries(fieldFilters).forEach(([field, value]) => {
    if (value !== undefined) {
      whereClause[field] = value;
    }
  });
  
  // Add custom logic for specific fields
  if (fieldFilters.priceRange) {
    const [min, max] = fieldFilters.priceRange.split('-').map(Number);
    whereClause.price = { gte: min, lte: max };
    delete whereClause.priceRange; // Remove the helper field
  }
  
  const products = await database.products.findMany({
    where: whereClause
  });
  
  return products;
}
```

## Next Steps

- Learn about [Type Safety](./type-safety.md) for better development experience
- Explore [Custom Routes](./custom-routes.md) for advanced functionality
- Check out [Examples](./examples.md) for real-world implementations
