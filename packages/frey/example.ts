import { z } from "zod";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { defineEntity } from "./src/entity.js";
import { startServer } from "./src/main.js";
import { FREY_ROLES, createRoleConstants } from "./src/auth/types.js";
import jwt from "jsonwebtoken";

// Define custom roles for this application
const customRoles = {
  MODERATOR: "moderator",
  GUEST: "guest",
};

// Create extended role constants
const ROLES = createRoleConstants(customRoles);

const userSchema = z.object({
  uuid: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customId: "uuid",
  // RBAC configuration
  rbac: {
    ownerField: "uuid", // Field that determines ownership (default is "id")
    operations: {
      [ROLES.ADMIN]: {
        delete: "All", // Only admins can delete users
      },
      [ROLES.USER]: {
        delete: "Own", // Users can only delete their own users
      },
    },
    customChecks: {
      update: async (context, entity, operation) => {
        // Custom logic: users can only update their own profile
        // unless they're admin
        const user = context.auth.user;
        if (user?.role === ROLES.ADMIN) return true;
        return entity.id === user?.id;
      }
    }
  },
  customRoutes: [
    {
      path: "/profile",
      method: "GET",
      auth: {
        jwtOnly: true,
        // requireAuth: true - not needed, defaults to true when auth.enabled is true
      },
      registerRoute: async (
        request: FastifyRequest,
        reply: FastifyReply,
        { server, entity }: any,
      ) => {
        const auth = (request as any).auth;
        reply.send({
          message: "User profile",
          user: auth.user,
          entityName: entity.name,
          timestamp: new Date().toISOString(),
        });
      },
    },
    {
      path: "/public",
      method: "GET",
      auth: {
        requireAuth: false, // Explicitly opt-out of authentication
      },
      registerRoute: async (
        request: FastifyRequest,
        reply: FastifyReply,
        { server, entity }: any,
      ) => {
        reply.send({
          message: "Public endpoint - no auth required",
          entityName: entity.name,
          timestamp: new Date().toISOString(),
        });
      },
    },
    {
      path: "/stats",
      method: "GET",
      // auth: { requireAuth: true } - not needed, defaults to true when auth.enabled is true
      registerRoute: async (
        request: FastifyRequest,
        reply: FastifyReply,
        { server, entity }: any,
      ) => {
        const auth = (request as any).auth;
        reply.send({
          totalUsers: 42,
          activeUsers: 38,
          entityName: entity.name,
          user: auth.user?.email,
        });
      },
    },
  ],
  findAll: async (params: any, { request, server, auth }: any) => {
    // Only return users if authenticated
    if (!auth.isAuthenticated) {
      throw new Error("Authentication required");
    }

    // Admin can see all users, others see limited data
    if (auth.user?.role === "admin") {
      return [
        {
          uuid: crypto.randomUUID(),
          name: "John Doe",
          email: "john.doe@example.com",
          createdAt: new Date(),
        },
        {
          uuid: crypto.randomUUID(),
          name: "Jane Smith",
          email: "jane.smith@example.com",
          createdAt: new Date(),
        },
      ];
    }

    // Regular users see limited data
    return [
      {
        uuid: crypto.randomUUID(),
        name: "Jane Smith",
        email: "jane.smith@example.com",
        createdAt: new Date(),
      },
    ];
  },
  findOne: async (param: any, { request, server, auth }: any) => {
    if (!auth.isAuthenticated) {
      throw new Error("Authentication required");
    }

    return {
      uuid: crypto.randomUUID(),
      name: "John Doe",
      email: "john.doe@example.com",
      createdAt: new Date(),
      };
  },
  create: async (params: any, { request, server, auth }: any) => {
    if (!auth.isAuthenticated) {
      throw new Error("Authentication required");
    }

    // RBAC middleware will check create permissions
    return {
      uuid: crypto.randomUUID(),
      name: params.name || "New User",
      email: params.email || "new@example.com",
      createdAt: new Date(),
      id: auth.user?.id, // Automatically set to current user
    };
  },
  update: async (params: any, { request, server, auth }: any) => {
    if (!auth.isAuthenticated) {
      throw new Error("Authentication required");
    }

    // RBAC middleware will check update permissions
    return {
      uuid: params.uuid,
      name: params.name || "Updated User",
      email: params.email || "updated@example.com",
      createdAt: new Date(),
      id: params.id || auth.user?.id,
    };
  },
  delete: async (params: any, { request, server, auth }: any) => {
    if (!auth.isAuthenticated) {
      throw new Error("Authentication required");
    }

    // RBAC middleware will check delete permissions
    return; // Successfully deleted
  },
});

const fastify = Fastify({
  logger: true,
});

startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  auth: {
    jwt: {
      secret: "your-secret-key", // In production, use environment variables
      expiresIn: "1h",
      extractUser: async (decoded: any) => {
        // Custom user extraction logic
        return {
          id: decoded.sub || decoded.id,
          email: decoded.email,
          role: decoded.role || "user",
          permissions: decoded.permissions || [],
        };
      },
    },
    apiKey: {
      headerName: "x-api-key",
      validateKey: async (key: string) => {
        // Simple API key validation - in production, check database
        if (key === "valid-api-key") {
          return {
            id: "api-user",
            email: "api@example.com",
            role: ROLES.USER,
            permissions: ["read"],
          };
        }
        return null;
      },
    },
    // RBAC configuration
    rbac: {
      customRoles: {
        [ROLES.MODERATOR]: {
          create: "All",
          read: "All", 
          update: "All",
          delete: "Custom" // Custom logic for delete
        },
        [ROLES.GUEST]: {
          read: "All"
          // No create/update/delete permissions
        }
      }
    }
  },
  swagger: {
    title: "Authenticated User Management API",
    description: "API for managing users with JWT and API key authentication",
    version: "1.0.0",
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  },
});

// Helper function to generate JWT tokens for testing
const generateTestToken = (user: any) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    },
    "your-secret-key",
    { expiresIn: "1h" }
  );
};

console.log("Server started with authentication and RBAC enabled");
console.log("Auto-enable behavior:");
console.log("- Auth: enabled when jwt or apiKey is configured");
console.log("- RBAC: enabled when rbac config is provided");
console.log("- Swagger: enabled when swagger config is provided");
console.log("\nDefault roles:");
console.log("- user: read=All, create/update/delete=Own");
console.log("- admin: read/create/update/delete=All");
console.log("\nCustom roles:");
console.log("- moderator: create/read/update=All, delete=Custom");
console.log("- guest: read=All");
console.log("\nTest JWT token for admin user:");
console.log(
  generateTestToken({
    id: "1",
    email: "admin@example.com",
    role: "admin",
    permissions: ["read", "write", "delete"],
  })
);
console.log("\nTest JWT token for regular user:");
console.log(
  generateTestToken({
    id: "2",
    email: "user@example.com",
    role: ROLES.USER,
    permissions: ["read"],
  })
);
console.log("\nTest JWT token for moderator:");
console.log(
  generateTestToken({
    id: "3",
    email: "moderator@example.com",
    role: ROLES.MODERATOR,
    permissions: ["read", "write"],
  })
);
console.log("\nTest API key: valid-api-key");
console.log("\nTry these endpoints:");
console.log("- GET /user (requires auth, RBAC: read=All)");
console.log("- POST /user (requires auth, RBAC: create=Own)");
console.log("- PUT /user/:uuid (requires auth, RBAC: update=Custom logic)");
console.log("- DELETE /user/:uuid (requires auth, RBAC: delete=All for admins)");
console.log("- GET /user/public (no auth required)");
console.log("- GET /user/profile (JWT only)");
console.log("- GET /user/stats (requires auth)");
