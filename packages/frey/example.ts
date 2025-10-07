import { z } from "zod";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { defineEntity } from "./src/entity.js";
import { startServer } from "./src/main.js";
import jwt from "jsonwebtoken";

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
  // auth: { requireAuth: true } - not needed, defaults to true when auth.enabled is true
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
  // delete: (params: any, context: any) => {},
  // create: (params: any, context: any) => {},
  // update: (params: any, context: any) => {},
});

const fastify = Fastify({
  logger: true,
});

startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  auth: {
    enabled: true,
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
            role: "user",
            permissions: ["read"],
          };
        }
        return null;
      },
    },
  },
  swagger: {
    enabled: true,
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

console.log("Server started with authentication enabled");
console.log("Test JWT token for admin user:");
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
    role: "user",
    permissions: ["read"],
  })
);
console.log("\nTest API key: valid-api-key");
console.log("\nTry these endpoints:");
console.log("- GET /user (requires auth)");
console.log("- GET /user/public (no auth required)");
console.log("- GET /user/profile (JWT only)");
console.log("- GET /user/stats (requires auth)");
