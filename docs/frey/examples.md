---
title: Examples
description: Real-world examples and use cases for building APIs with Frey
order: 7
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

A user management system with role-based access control:

```typescript
import { z } from "zod";
import { defineEntity, startServer } from "frey";

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
      registerRoute: async (request, reply, { server, entity }) => {
        const userId = request.headers['x-user-id'] as string;
        
        if (!userId) {
          reply.code(401).send({ error: "Unauthorized" });
          return;
        }
        
        const user = await database.users.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          reply.code(404).send({ error: "User not found" });
          return;
        }
        
        reply.send(user);
      },
    },
    {
      path: "/login",
      method: "POST",
      registerRoute: async (request, reply, { server, entity }) => {
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
        
        const token = generateJWT(user);
        
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
      registerRoute: async (request, reply, { server, entity }) => {
        const userRole = request.headers['x-user-role'] as string;
        
        if (userRole !== 'admin') {
          reply.code(403).send({ error: "Admin access required" });
          return;
        }
        
        const adminData = await getAdminData();
        reply.send(adminData);
      },
    },
  ],
  findAll: async (params, { request, server }) => {
    const userRole = request.headers['x-user-role'] as string;
    
    // Only admins can see all users
    if (userRole !== 'admin') {
      reply.code(403).send({ error: "Admin access required" });
      return;
    }
    
    const users = await database.users.findMany({
      take: params.limit || 10,
      skip: params.offset || 0,
      orderBy: params.sort ? { [params.sort]: params.order || 'asc' } : { createdAt: 'desc' },
      where: params.filters || {},
    });
    
    return users;
  },
  findOne: async (param, { request, server }) => {
    const userRole = request.headers['x-user-role'] as string;
    const userId = request.headers['x-user-id'] as string;
    
    // Users can only see their own profile, admins can see any
    if (userRole !== 'admin' && param.id !== userId) {
      reply.code(403).send({ error: "Access denied" });
      return;
    }
    
    const user = await database.users.findUnique({
      where: { id: param.id }
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  },
  create: async (params, { request, server }) => {
    const userRole = request.headers['x-user-role'] as string;
    
    // Only admins can create users
    if (userRole !== 'admin') {
      reply.code(403).send({ error: "Admin access required" });
      return;
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
  update: async (params, { request, server }) => {
    const userRole = request.headers['x-user-role'] as string;
    const userId = request.headers['x-user-id'] as string;
    
    // Users can only update their own profile, admins can update any
    if (userRole !== 'admin' && params.id !== userId) {
      reply.code(403).send({ error: "Access denied" });
      return;
    }
    
    const user = await database.users.update({
      where: { id: params.id },
      data: params.data
    });
    
    return user;
  },
  delete: async (params, { request, server }) => {
    const userRole = request.headers['x-user-role'] as string;
    
    // Only admins can delete users
    if (userRole !== 'admin') {
      reply.code(403).send({ error: "Admin access required" });
      return;
    }
    
    await database.users.delete({
      where: { id: params.id }
    });
  },
});
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
