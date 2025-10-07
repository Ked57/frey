# Role-Based Access Control (RBAC)

Frey provides a comprehensive Role-Based Access Control (RBAC) system that allows you to define granular permissions based on user roles and entity ownership.

## Overview

RBAC in Frey works by:
- **Default Roles**: Built-in `admin` and `user` roles with sensible defaults
- **Custom Roles**: Define your own roles with specific permissions
- **Entity Ownership**: Control access based on who owns the entity
- **Operation Scopes**: `All`, `Own`, or `Custom` permission scopes
- **Role Constants**: Type-safe role definitions with autocomplete

## Quick Start

```typescript
import { startServer, defineEntity } from "frey";
import { FREY_ROLES, createRoleConstants } from "frey/auth/types";
import { z } from "zod";

// Define custom roles
const customRoles = {
  MODERATOR: "moderator",
  GUEST: "guest",
};

const ROLES = createRoleConstants(customRoles);

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum([ROLES.ADMIN, ROLES.USER, ROLES.MODERATOR, ROLES.GUEST]),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  rbac: {
    ownerField: "id", // Field that determines ownership
    operations: {
      [ROLES.ADMIN]: { delete: "All" },     // Admins can delete any user
      [ROLES.USER]: { delete: "Own" },       // Users can only delete themselves
      [ROLES.MODERATOR]: { delete: "All" },   // Moderators can delete any user
      [ROLES.GUEST]: { read: "All" },         // Guests can only read
    },
  },
  // ... CRUD methods
});

startServer(fastify, {
  entities: [userEntity],
  auth: {
    jwt: { secret: "your-secret" },
    rbac: {
      customRoles: {
        [ROLES.MODERATOR]: {
          create: "All",
          read: "All",
          update: "All",
          delete: "Custom", // Custom logic
        },
        [ROLES.GUEST]: {
          read: "All",
        },
      },
    },
  },
});
```

## Default Roles

Frey comes with two built-in roles:

### Admin Role
- **Create**: `All` - Can create any entity
- **Read**: `All` - Can read any entity
- **Update**: `All` - Can update any entity
- **Delete**: `All` - Can delete any entity

### User Role
- **Create**: `Own` - Can create entities they own
- **Read**: `All` - Can read any entity
- **Update**: `Own` - Can update entities they own
- **Delete**: `Own` - Can delete entities they own

## Role Constants

Use type-safe role constants to avoid magic strings:

```typescript
import { FREY_ROLES, createRoleConstants, COMMON_ROLES } from "frey/auth/types";

// Default roles
FREY_ROLES.ADMIN  // "admin"
FREY_ROLES.USER   // "user"

// Common custom roles
COMMON_ROLES.MODERATOR  // "moderator"
COMMON_ROLES.GUEST      // "guest"
COMMON_ROLES.EDITOR     // "editor"
COMMON_ROLES.VIEWER     // "viewer"

// Create custom role constants
const customRoles = {
  MANAGER: "manager",
  REVIEWER: "reviewer",
};

const ROLES = createRoleConstants(customRoles);
// Now you have: ROLES.ADMIN, ROLES.USER, ROLES.MANAGER, ROLES.REVIEWER
```

## Permission Scopes

### All
Grants permission to perform the operation on any entity, regardless of ownership.

```typescript
operations: {
  [ROLES.ADMIN]: { delete: "All" } // Admin can delete any user
}
```

### Own
Grants permission only for entities owned by the current user.

```typescript
operations: {
  [ROLES.USER]: { update: "Own" } // User can only update their own profile
}
```

### Custom
Allows custom logic for permission checking.

```typescript
operations: {
  [ROLES.MODERATOR]: { delete: "Custom" }
},
customChecks: {
  delete: async (context, entity, operation) => {
    const user = context.auth.user;
    // Custom logic: moderators can delete users except other moderators
    return entity.role !== "moderator";
  }
}
```

## Entity Configuration

### Basic RBAC Setup

```typescript
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  rbac: {
    ownerField: "id", // Default ownership field
    operations: {
      [ROLES.ADMIN]: { delete: "All" },
      [ROLES.USER]: { delete: "Own" },
    },
  },
  // ... CRUD methods
});
```

### Custom Ownership Field

```typescript
const postEntity = defineEntity({
  name: "post",
  schema: postSchema,
  rbac: {
    ownerField: "authorId", // Custom ownership field
    operations: {
      [ROLES.USER]: { update: "Own" }, // Users can update their own posts
    },
  },
  // ... CRUD methods
});
```

### Role-Specific Operations

```typescript
const articleEntity = defineEntity({
  name: "article",
  schema: articleSchema,
  rbac: {
    operations: {
      [ROLES.ADMIN]: {
        create: "All",
        read: "All",
        update: "All",
        delete: "All",
      },
      [ROLES.EDITOR]: {
        create: "All",
        read: "All",
        update: "All",
        delete: "Own", // Editors can only delete their own articles
      },
      [ROLES.WRITER]: {
        create: "Own",
        read: "All",
        update: "Own",
        delete: "Own",
      },
    },
  },
  // ... CRUD methods
});
```

### Custom Permission Logic

```typescript
const commentEntity = defineEntity({
  name: "comment",
  schema: commentSchema,
  rbac: {
    operations: {
      [ROLES.MODERATOR]: { delete: "Custom" },
    },
    customChecks: {
      delete: async (context, entity, operation) => {
        const user = context.auth.user;
        const comment = entity;
        
        // Moderators can delete comments that are:
        // 1. Their own comments
        // 2. Comments on posts they moderate
        // 3. Comments flagged as inappropriate
        
        if (comment.authorId === user.id) return true;
        if (comment.isFlagged) return true;
        
        // Check if user moderates the post
        const post = await getPost(comment.postId);
        return post.moderatorId === user.id;
      }
    },
  },
  // ... CRUD methods
});
```

## Server Configuration

### Global RBAC Setup

```typescript
startServer(fastify, {
  entities: [userEntity, postEntity],
  auth: {
    jwt: { secret: "your-secret" },
    rbac: {
      // RBAC is auto-enabled when this config is present
      customRoles: {
        [ROLES.MODERATOR]: {
          create: "All",
          read: "All",
          update: "All",
          delete: "Custom",
        },
        [ROLES.GUEST]: {
          read: "All",
        },
      },
    },
  },
});
```

### Auto-Enable Behavior

RBAC is automatically enabled when you provide RBAC configuration:

```typescript
// This automatically enables RBAC
auth: {
  rbac: {
    customRoles: { /* ... */ }
  }
}

// Equivalent to:
auth: {
  rbac: {
    enabled: true, // Optional - auto-enabled
    customRoles: { /* ... */ }
  }
}
```

## Advanced Examples

### Multi-Tenant Application

```typescript
const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
});

const tenantEntity = defineEntity({
  name: "tenant",
  schema: tenantSchema,
  rbac: {
    ownerField: "ownerId",
    operations: {
      [ROLES.ADMIN]: { create: "All", read: "All", update: "All", delete: "All" },
      [ROLES.USER]: { create: "Own", read: "Own", update: "Own", delete: "Own" },
    },
    customChecks: {
      read: async (context, entity, operation) => {
        const user = context.auth.user;
        // Users can read tenants they own or are members of
        return entity.ownerId === user.id || 
               await isTenantMember(user.id, entity.id);
      }
    },
  },
  // ... CRUD methods
});
```

### Content Management System

```typescript
const contentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  status: z.enum(["draft", "published", "archived"]),
});

const contentEntity = defineEntity({
  name: "content",
  schema: contentSchema,
  rbac: {
    ownerField: "authorId",
    operations: {
      [ROLES.ADMIN]: { create: "All", read: "All", update: "All", delete: "All" },
      [ROLES.EDITOR]: { create: "All", read: "All", update: "All", delete: "Own" },
      [ROLES.WRITER]: { create: "Own", read: "All", update: "Own", delete: "Own" },
    },
    customChecks: {
      update: async (context, entity, operation) => {
        const user = context.auth.user;
        
        // Writers can only update drafts
        if (user.role === ROLES.WRITER && entity.status !== "draft") {
          return false;
        }
        
        // Editors can update published content
        return true;
      },
      delete: async (context, entity, operation) => {
        const user = context.auth.user;
        
        // Can't delete published content
        if (entity.status === "published") {
          return user.role === ROLES.ADMIN;
        }
        
        return true;
      }
    },
  },
  // ... CRUD methods
});
```

## Best Practices

### 1. Use Role Constants
Always use role constants instead of magic strings:

```typescript
// ❌ Bad
operations: {
  "admin": { delete: "All" },
  "user": { delete: "Own" }
}

// ✅ Good
operations: {
  [ROLES.ADMIN]: { delete: "All" },
  [ROLES.USER]: { delete: "Own" }
}
```

### 2. Define Clear Ownership
Make ownership explicit and consistent:

```typescript
// Clear ownership field
rbac: {
  ownerField: "authorId", // Not just "id"
  operations: {
    [ROLES.USER]: { update: "Own" }
  }
}
```

### 3. Use Custom Logic Sparingly
Prefer `All` and `Own` scopes over custom logic when possible:

```typescript
// ✅ Simple and clear
operations: {
  [ROLES.ADMIN]: { delete: "All" },
  [ROLES.USER]: { delete: "Own" }
}

// Use custom logic only when necessary
customChecks: {
  delete: async (context, entity, operation) => {
    // Complex business logic here
  }
}
```

### 4. Test RBAC Logic
Always test your RBAC configuration:

```typescript
import { checkRbacPermission } from "frey/auth/rbac";

const canDelete = await checkRbacPermission(
  user,
  "user",
  "delete",
  entityData,
  context,
  entityRbacConfig
);

expect(canDelete).toBe(true);
```

## Error Handling

RBAC violations return appropriate HTTP status codes:

- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User authenticated but lacks permission
- **404 Not Found**: Entity not found or user can't access it

## Migration Guide

### From Basic Auth to RBAC

1. **Add RBAC configuration**:
```typescript
// Before
auth: {
  jwt: { secret: "secret" }
}

// After
auth: {
  jwt: { secret: "secret" },
  rbac: {
    customRoles: {
      [ROLES.MODERATOR]: { /* ... */ }
    }
  }
}
```

2. **Update entity definitions**:
```typescript
// Before
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  // ... CRUD methods
});

// After
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  rbac: {
    operations: {
      [ROLES.ADMIN]: { delete: "All" },
      [ROLES.USER]: { delete: "Own" }
    }
  },
  // ... CRUD methods
});
```

3. **Replace magic strings with constants**:
```typescript
// Before
if (user.role === "admin") { /* ... */ }

// After
if (user.role === ROLES.ADMIN) { /* ... */ }
```

## Troubleshooting

### Common Issues

**RBAC not working**: Ensure RBAC configuration is provided in `auth.rbac`

**Permission denied**: Check if user role is correctly set in JWT token

**Ownership not working**: Verify `ownerField` matches the actual field name in your schema

**Custom logic not executing**: Ensure `customChecks` function returns a boolean

### Debug Tips

```typescript
// Log RBAC decisions
customChecks: {
  delete: async (context, entity, operation) => {
    const user = context.auth.user;
    console.log(`RBAC Check: ${user.role} trying to ${operation} ${entity.id}`);
    
    const result = /* your logic */;
    console.log(`RBAC Result: ${result}`);
    
    return result;
  }
}
```

## API Reference

### Types

```typescript
type PermissionScope = 'All' | 'Own' | 'Custom';

type Permission = {
  scope: PermissionScope;
  customCheck?: (context: any, entity: any, operation: string) => Promise<boolean>;
};

type RolePermissions = {
  create?: PermissionScope | Permission;
  read?: PermissionScope | Permission;
  update?: PermissionScope | Permission;
  delete?: PermissionScope | Permission;
};

type EntityRbacConfig = {
  ownerField?: string;
  operations?: {
    [roleName: string]: {
      findAll?: PermissionScope;
      findOne?: PermissionScope;
      read?: PermissionScope;
      create?: PermissionScope;
      update?: PermissionScope;
      delete?: PermissionScope;
    };
  };
  customChecks?: {
    findAll?: (context: any, entity: any, operation: string) => Promise<boolean>;
    findOne?: (context: any, entity: any, operation: string) => Promise<boolean>;
    read?: (context: any, entity: any, operation: string) => Promise<boolean>;
    create?: (context: any, entity: any, operation: string) => Promise<boolean>;
    update?: (context: any, entity: any, operation: string) => Promise<boolean>;
    delete?: (context: any, entity: any, operation: string) => Promise<boolean>;
  };
};
```

### Functions

```typescript
// Check if user has permission for an operation
checkRbacPermission(
  user: User,
  entityName: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  entityData: any,
  context: Context,
  entityRbacConfig?: EntityRbacConfig,
  customRoles?: { [roleName: string]: RolePermissions }
): Promise<boolean>

// Get default role permissions
getDefaultRoles(): Record<string, RolePermissions>

// Create RBAC middleware
createRbacMiddleware(
  entityName: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  entityRbacConfig?: EntityRbacConfig,
  customRoles?: { [roleName: string]: RolePermissions }
): Function
```
