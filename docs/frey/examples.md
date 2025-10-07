---
title: Examples
description: Real-world examples and use cases for building APIs with Frey
order: 9
---

# Examples

Real-world examples and use cases for Frey.

## Basic CRUD API

A simple user management API:

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "frey";

// Define the user schema
const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  isActive: z.boolean(),
  createdAt: z.date(),
});

// Create the user entity
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  findAll: async (params, { request, server }) => {
    const users = await database.users.findMany({
      take: params.limit || 10,
      skip: params.offset || 0,
      orderBy: params.sort ? { [params.sort]: params.order || 'asc' } : { createdAt: 'desc' },
      where: params.filters || {},
    });
    return users;
  },
  findOne: async (param, { request, server }) => {
    const user = await database.users.findUnique({
      where: { id: param.id }
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
  create: async (params, { request, server }) => {
    const user = await database.users.create({
      data: {
        ...params,
        id: generateId(),
        createdAt: new Date(),
      }
    });
    return user;
  },
  update: async (params, { request, server }) => {
    const user = await database.users.update({
      where: { id: params.id },
      data: params.data
    });
    return user;
  },
  delete: async (params, { request, server }) => {
    await database.users.delete({
      where: { id: params.id }
    });
  },
});

// Start the server
const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [userEntity],
  port: 3000,
});
```

## E-commerce Product API

A more complex example with products, categories, and inventory:

```typescript
import { z } from "zod";
import { defineEntity, startServer } from "frey";

// Product schema with nested objects
const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.object({
    id: z.string(),
    name: z.string(),
  }),
  inventory: z.object({
    stock: z.number().int().min(0),
    reserved: z.number().int().min(0),
    available: z.number().int().min(0),
  }),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const productEntity = defineEntity({
  name: "product",
  schema: productSchema,
  customRoutes: [
    {
      path: "/search",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const query = request.query.q as string;
        const category = request.query.category as string;
        const minPrice = parseFloat(request.query.minPrice as string) || 0;
        const maxPrice = parseFloat(request.query.maxPrice as string) || Infinity;
        
        const products = await database.products.findMany({
          where: {
            AND: [
              query ? {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                ]
              } : {},
              category ? { category: { name: category } } : {},
              { price: { gte: minPrice, lte: maxPrice } },
              { isActive: true },
            ]
          },
          include: { category: true },
        });
        
        reply.send({ results: products, query, filters: { category, minPrice, maxPrice } });
      },
    },
    {
      path: "/:id/inventory",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const productId = request.params.id as string;
        
        const product = await database.products.findUnique({
          where: { id: productId },
          select: { inventory: true, name: true }
        });
        
        if (!product) {
          reply.code(404).send({ error: "Product not found" });
          return;
        }
        
        reply.send({
          productId,
          productName: product.name,
          inventory: product.inventory,
        });
      },
    },
    {
      path: "/:id/reserve",
      method: "POST",
      registerRoute: async (request, reply, { server, entity }) => {
        const productId = request.params.id as string;
        const { quantity } = request.body as { quantity: number };
        
        if (quantity <= 0) {
          reply.code(400).send({ error: "Quantity must be positive" });
          return;
        }
        
        const product = await database.products.findUnique({
          where: { id: productId }
        });
        
        if (!product) {
          reply.code(404).send({ error: "Product not found" });
          return;
        }
        
        if (product.inventory.available < quantity) {
          reply.code(400).send({ error: "Insufficient inventory" });
          return;
        }
        
        const updatedProduct = await database.products.update({
          where: { id: productId },
          data: {
            inventory: {
              stock: product.inventory.stock,
              reserved: product.inventory.reserved + quantity,
              available: product.inventory.available - quantity,
            }
          }
        });
        
        reply.send({
          success: true,
          reserved: quantity,
          newInventory: updatedProduct.inventory,
        });
      },
    },
  ],
  findAll: async (params, { request, server }) => {
    const products = await database.products.findMany({
      take: params.limit || 20,
      skip: params.offset || 0,
      orderBy: params.sort ? { [params.sort]: params.order || 'asc' } : { createdAt: 'desc' },
      where: {
        AND: [
          params.filters || {},
          { isActive: true },
        ]
      },
      include: { category: true },
    });
    
    const total = await database.products.count({
      where: { isActive: true }
    });
    
    return {
      data: products,
      pagination: {
        limit: params.limit || 20,
        offset: params.offset || 0,
        total,
        hasMore: (params.offset || 0) + products.length < total
      }
    };
  },
  findOne: async (param, { request, server }) => {
    const product = await database.products.findUnique({
      where: { id: param.id },
      include: { category: true }
    });
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    return product;
  },
  create: async (params, { request, server }) => {
    const product = await database.products.create({
      data: {
        ...params,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { category: true }
    });
    
    return product;
  },
  update: async (params, { request, server }) => {
    const product = await database.products.update({
      where: { id: params.id },
      data: {
        ...params.data,
        updatedAt: new Date(),
      },
      include: { category: true }
    });
    
    return product;
  },
  delete: async (params, { request, server }) => {
    // Soft delete by setting isActive to false
    await database.products.update({
      where: { id: params.id },
      data: { isActive: false, updatedAt: new Date() }
    });
  },
});
```

## Blog API with Comments

A blog system with posts and comments:

```typescript
import { z } from "zod";
import { defineEntity, startServer } from "frey";

// Post schema
const postSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  tags: z.array(z.string()),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Comment schema
const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  content: z.string().min(1).max(1000),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  status: z.enum(["pending", "approved", "rejected"]),
  createdAt: z.date(),
});

const postEntity = defineEntity({
  name: "post",
  schema: postSchema,
  customRoutes: [
    {
      path: "/published",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const posts = await database.posts.findMany({
          where: { status: "published" },
          orderBy: { publishedAt: "desc" },
          take: parseInt(request.query.limit as string) || 10,
        });
        
        reply.send(posts);
      },
    },
    {
      path: "/:id/comments",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const postId = request.params.id as string;
        
        const comments = await database.comments.findMany({
          where: { 
            postId,
            status: "approved"
          },
          orderBy: { createdAt: "asc" }
        });
        
        reply.send(comments);
      },
    },
    {
      path: "/:id/publish",
      method: "POST",
      registerRoute: async (request, reply, { server, entity }) => {
        const postId = request.params.id as string;
        
        const post = await database.posts.findUnique({
          where: { id: postId }
        });
        
        if (!post) {
          reply.code(404).send({ error: "Post not found" });
          return;
        }
        
        if (post.status !== "draft") {
          reply.code(400).send({ error: "Only draft posts can be published" });
          return;
        }
        
        const publishedPost = await database.posts.update({
          where: { id: postId },
          data: {
            status: "published",
            publishedAt: new Date(),
            updatedAt: new Date(),
          }
        });
        
        reply.send(publishedPost);
      },
    },
  ],
  findAll: async (params, { request, server }) => {
    const posts = await database.posts.findMany({
      take: params.limit || 10,
      skip: params.offset || 0,
      orderBy: params.sort ? { [params.sort]: params.order || 'desc' } : { createdAt: 'desc' },
      where: params.filters || {},
      include: { author: true }
    });
    
    return posts;
  },
  findOne: async (param, { request, server }) => {
    const post = await database.posts.findUnique({
      where: { id: param.id },
      include: { author: true }
    });
    
    if (!post) {
      throw new Error("Post not found");
    }
    
    return post;
  },
  create: async (params, { request, server }) => {
    const post = await database.posts.create({
      data: {
        ...params,
        id: generateId(),
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { author: true }
    });
    
    return post;
  },
  update: async (params, { request, server }) => {
    const post = await database.posts.update({
      where: { id: params.id },
      data: {
        ...params.data,
        updatedAt: new Date(),
      },
      include: { author: true }
    });
    
    return post;
  },
  delete: async (params, { request, server }) => {
    await database.posts.delete({
      where: { id: params.id }
    });
  },
});

const commentEntity = defineEntity({
  name: "comment",
  schema: commentSchema,
  customRoutes: [
    {
      path: "/pending",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        const comments = await database.comments.findMany({
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
          include: { post: { select: { title: true } } }
        });
        
        reply.send(comments);
      },
    },
    {
      path: "/:id/approve",
      method: "POST",
      registerRoute: async (request, reply, { server, entity }) => {
        const commentId = request.params.id as string;
        
        const comment = await database.comments.update({
          where: { id: commentId },
          data: { status: "approved" }
        });
        
        reply.send(comment);
      },
    },
    {
      path: "/:id/reject",
      method: "POST",
      registerRoute: async (request, reply, { server, entity }) => {
        const commentId = request.params.id as string;
        
        const comment = await database.comments.update({
          where: { id: commentId },
          data: { status: "rejected" }
        });
        
        reply.send(comment);
      },
    },
  ],
  findAll: async (params, { request, server }) => {
    const comments = await database.comments.findMany({
      take: params.limit || 20,
      skip: params.offset || 0,
      orderBy: params.sort ? { [params.sort]: params.order || 'desc' } : { createdAt: 'desc' },
      where: params.filters || {},
    });
    
    return comments;
  },
  findOne: async (param, { request, server }) => {
    const comment = await database.comments.findUnique({
      where: { id: param.id }
    });
    
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    return comment;
  },
  create: async (params, { request, server }) => {
    const comment = await database.comments.create({
      data: {
        ...params,
        id: generateId(),
        status: "pending",
        createdAt: new Date(),
      }
    });
    
    return comment;
  },
  update: async (params, { request, server }) => {
    const comment = await database.comments.update({
      where: { id: params.id },
      data: params.data
    });
    
    return comment;
  },
  delete: async (params, { request, server }) => {
    await database.comments.delete({
      where: { id: params.id }
    });
  },
});

// Start the server
const fastify = Fastify({ logger: true });
startServer(fastify, {
  entities: [postEntity, commentEntity],
  port: 3000,
});
```

## Authentication & Authorization

A user management system with JWT and API key authentication:

```typescript
import { z } from "zod";
import { defineEntity, startServer } from "frey";
import jwt from "jsonwebtoken";

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "user", "guest"]),
  isActive: z.boolean(),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customRoutes: [
    {
      path: "/me",
      method: "GET",
      auth: { jwtOnly: true },
      registerRoute: async (request, reply) => {
        const auth = (request as any).auth;
        reply.send(auth.user);
      },
    },
    {
      path: "/login",
      method: "POST",
      auth: { requireAuth: false },
      registerRoute: async (request, reply) => {
        const { email, password } = request.body as { email: string; password: string };
        
        const user = await database.users.findUnique({
          where: { email }
        });
        
        if (!user || !await verifyPassword(password, user.passwordHash)) {
          reply.code(401).send({ error: "Invalid credentials" });
          return;
        }
        
        if (!user.isActive) {
          reply.code(403).send({ error: "Account is disabled" });
          return;
        }
        
        // Update last login
        await database.users.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
        
        const token = jwt.sign(
          { 
            sub: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role 
          },
          "your-secret-key",
          { expiresIn: "1h" }
        );
        
        reply.send({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        });
      },
    },
    {
      path: "/admin-only",
      method: "GET",
      auth: { 
        customAuth: async (request) => {
          const auth = (request as any).auth;
          return auth.user?.role === 'admin';
        }
      },
      registerRoute: async (request, reply) => {
        const adminData = await getAdminData();
        reply.send(adminData);
      },
    },
    {
      path: "/public",
      method: "GET",
      auth: { requireAuth: false },
      registerRoute: async (request, reply) => {
        reply.send({ message: "This is a public endpoint" });
      },
    },
  ],
  findAll: async (params, { auth }) => {
    // Only admins can see all users
    if (auth.user?.role !== 'admin') {
      throw new Error("Admin access required");
    }
    
    const users = await database.users.findMany({
      take: params.limit || 10,
      skip: params.offset || 0,
      orderBy: params.sort ? { [params.sort]: params.order || 'asc' } : { createdAt: 'desc' },
      where: params.filters || {},
    });
    
    return users;
  },
  findOne: async (param, { auth }) => {
    // Users can only see their own profile, admins can see any
    if (auth.user?.role !== 'admin' && param.id !== auth.user?.id) {
      throw new Error("Access denied");
    }
    
    const user = await database.users.findUnique({
      where: { id: param.id }
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  },
  create: async (params, { auth }) => {
    // Only admins can create users
    if (auth.user?.role !== 'admin') {
      throw new Error("Admin access required");
    }
    
    const user = await database.users.create({
      data: {
        ...params,
        id: generateId(),
        createdAt: new Date(),
      }
    });
    
    return user;
  },
  update: async (params, { auth }) => {
    // Users can only update their own profile, admins can update any
    if (auth.user?.role !== 'admin' && params.id !== auth.user?.id) {
      throw new Error("Access denied");
    }
    
    const user = await database.users.update({
      where: { id: params.id },
      data: params.data
    });
    
    return user;
  },
  delete: async (params, { auth }) => {
    // Only admins can delete users
    if (auth.user?.role !== 'admin') {
      throw new Error("Admin access required");
    }
    
    await database.users.delete({
      where: { id: params.id }
    });
  },
});

// Start the server with authentication
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
        if (key === "admin-api-key") {
          return {
            id: "admin-api-user",
            email: "admin@example.com",
            name: "Admin API User",
            role: "admin",
          };
        }
        return null;
      },
    },
  },
});
```

```

## Role-Based Access Control (RBAC)

A comprehensive example showing RBAC with custom roles:

```typescript
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity, startServer } from "frey";
import { FREY_ROLES, createRoleConstants } from "frey/auth/types";

// Define custom roles for this application
const customRoles = {
  MODERATOR: "moderator",
  GUEST: "guest",
  EDITOR: "editor",
};

const ROLES = createRoleConstants(customRoles);

// User schema with role field
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum([
    ROLES.ADMIN,
    ROLES.USER,
    ROLES.MODERATOR,
    ROLES.GUEST,
    ROLES.EDITOR,
  ]),
  createdAt: z.date(),
});

// Post schema with author ownership
const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(), // Ownership field
  status: z.enum(["draft", "published", "archived"]),
  createdAt: z.date(),
});

// User entity with RBAC
const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  rbac: {
    ownerField: "id",
    operations: {
      [ROLES.ADMIN]: { delete: "All" },     // Admins can delete any user
      [ROLES.USER]: { delete: "Own" },       // Users can only delete themselves
      [ROLES.MODERATOR]: { delete: "All" },   // Moderators can delete any user
      [ROLES.GUEST]: { read: "All" },         // Guests can only read
    },
    customChecks: {
      update: async (context, entity, operation) => {
        const user = context.auth.user;
        // Custom logic: users can only update their own profile
        // unless they're admin or moderator
        if (user?.role === ROLES.ADMIN || user?.role === ROLES.MODERATOR) {
          return true;
        }
        return entity.id === user?.id;
      }
    }
  },
  findAll: async (params, { auth }) => {
    // Return users based on role permissions
    const users = await database.users.findMany();
    return users;
  },
  create: async (params, { auth }) => {
    return await database.users.create({
      data: {
        ...params,
        id: generateId(),
        createdAt: new Date(),
      }
    });
  },
  update: async (params, { auth }) => {
    return await database.users.update({
      where: { id: params.id },
      data: params,
    });
  },
  delete: async (params, { auth }) => {
    await database.users.delete({
      where: { id: params.id }
    });
  },
});

// Post entity with content management RBAC
const postEntity = defineEntity({
  name: "post",
  schema: postSchema,
  rbac: {
    ownerField: "authorId",
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
        delete: "Own", // Editors can only delete their own posts
      },
      [ROLES.USER]: {
        create: "Own",
        read: "All",
        update: "Own",
        delete: "Own",
      },
      [ROLES.GUEST]: {
        read: "All", // Guests can only read published posts
      },
    },
    customChecks: {
      read: async (context, entity, operation) => {
        const user = context.auth.user;
        
        // Guests can only read published posts
        if (user?.role === ROLES.GUEST) {
          return entity.status === "published";
        }
        
        // Others can read all posts
        return true;
      },
      update: async (context, entity, operation) => {
        const user = context.auth.user;
        
        // Users can only update draft posts
        if (user?.role === ROLES.USER && entity.status !== "draft") {
          return false;
        }
        
        // Editors and admins can update any post
        return true;
      },
      delete: async (context, entity, operation) => {
        const user = context.auth.user;
        
        // Can't delete published posts unless admin
        if (entity.status === "published") {
          return user?.role === ROLES.ADMIN;
        }
        
        return true;
      }
    }
  },
  findAll: async (params, { auth }) => {
    const posts = await database.posts.findMany({
      where: {
        // Apply role-based filtering
        ...(auth.user?.role === ROLES.GUEST ? { status: "published" } : {}),
        ...params.filters,
      },
    });
    return posts;
  },
  create: async (params, { auth }) => {
    return await database.posts.create({
      data: {
        ...params,
        id: generateId(),
        authorId: auth.user?.id, // Set author to current user
        createdAt: new Date(),
      }
    });
  },
  update: async (params, { auth }) => {
    return await database.posts.update({
      where: { id: params.id },
      data: params,
    });
  },
  delete: async (params, { auth }) => {
    await database.posts.delete({
      where: { id: params.id }
    });
  },
});

// Start server with RBAC configuration
const fastify = Fastify({ logger: true });

startServer(fastify, {
  entities: [userEntity, postEntity],
  port: 3000,
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: "24h",
    },
    rbac: {
      customRoles: {
        [ROLES.MODERATOR]: {
          create: "All",
          read: "All",
          update: "All",
          delete: "Custom", // Custom logic for delete
        },
        [ROLES.GUEST]: {
          read: "All",
        },
        [ROLES.EDITOR]: {
          create: "All",
          read: "All",
          update: "All",
          delete: "Own",
        },
      },
    },
  },
  swagger: {
    title: "Content Management API",
    description: "API with role-based access control",
  },
});

console.log("Server started with RBAC enabled");
console.log("Available roles:", Object.values(ROLES));
```

## Utility Functions

Common utility functions used in the examples:

```typescript
// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Password verification (example)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Implement your password verification logic
  return true;
}

// JWT generation (example)
function generateJWT(user: any): string {
  // Implement your JWT generation logic
  return "jwt-token";
}

// Admin data retrieval (example)
async function getAdminData(): Promise<any> {
  // Implement your admin data logic
  return { message: "Admin data" };
}
```

## Next Steps

- Learn about [Getting Started](./getting-started.md) for basic usage
- Explore [Entity Configuration](./entity-configuration.md) for advanced options
- Check out [API Reference](./api-reference.md) for complete documentation
