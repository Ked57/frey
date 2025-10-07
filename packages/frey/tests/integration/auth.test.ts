import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import Fastify from "fastify";
import { startServer, type ServerOptions } from "../../src/main.js";
import { defineEntity } from "../../src/entity.js";
import jwt from "jsonwebtoken";

describe("Authentication Integration Tests", () => {
  let fastify: any;
  let server: any;

  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["admin", "user", "guest"]),
  });

  const userEntity = defineEntity({
    name: "user",
    schema: userSchema,
    customId: "id",
    // auth: { requireAuth: true } - not needed, defaults to true when auth.enabled is true
    customRoutes: [
      {
        path: "/profile",
        method: "GET",
        auth: {
          jwtOnly: true,
          // requireAuth: true - not needed, defaults to true when auth.enabled is true
        },
        registerRoute: async (request, reply) => {
          const auth = (request as any).auth;
          reply.send({
            message: "User profile",
            user: auth.user,
          });
        },
      },
      {
        path: "/public",
        method: "GET",
        auth: {
          requireAuth: false, // Explicitly opt-out of authentication
        },
        registerRoute: async (request, reply) => {
          reply.send({
            message: "Public endpoint",
          });
        },
      },
    ],
    findAll: async (_params, { auth }) => {
      if (!auth.isAuthenticated) {
        throw new Error("Authentication required");
      }
      return [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "admin" as const,
        },
      ];
    },
    findOne: async (id, { auth }) => {
      if (!auth.isAuthenticated) {
        throw new Error("Authentication required");
      }
      return {
        id,
        name: "John Doe",
        email: "john@example.com",
        role: "admin" as const,
      };
    },
  });

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe("JWT Authentication", () => {
    it("should protect routes with JWT authentication", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 0,
        auth: {
          enabled: true,
          jwt: {
            secret: "test-secret",
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      // Test without token - should fail
      const response1 = await fetch(`http://localhost:${port}/user`);
      expect(response1.status).toBe(401);

      // Test with valid token - should succeed
      const token = jwt.sign(
        { sub: "123", email: "test@example.com", role: "user" },
        "test-secret",
        { expiresIn: "1h" },
      );

      const response2 = await fetch(`http://localhost:${port}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      expect(response2.status).toBe(200);
      const data = await response2.json();
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty("id");
    });

    it("should reject invalid JWT tokens", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 0,
        auth: {
          enabled: true,
          jwt: {
            secret: "test-secret",
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      // Test with invalid token
      const response = await fetch(`http://localhost:${port}/user`, {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });
      expect(response.status).toBe(401);
    });

    it("should inject user context into handlers", async () => {
      const testEntity = defineEntity({
        name: "test",
        schema: userSchema,
        auth: {
          requireAuth: true,
        },
        findAll: async (_params, { auth }) => {
          return [
            {
              id: auth.user?.id ?? "123",
              name: auth.user?.metadata?.name ?? "Test User",
              email: auth.user?.email ?? "test@example.com",
              role: (auth.user?.role ?? "user") as "admin" | "user" | "guest",
            },
          ];
        },
      });

      const options: ServerOptions = {
        entities: [testEntity],
        port: 0,
        auth: {
          enabled: true,
          jwt: {
            secret: "test-secret",
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      const token = jwt.sign(
        {
          sub: "123",
          email: "test@example.com",
          role: "user",
          name: "Test User",
        },
        "test-secret",
        { expiresIn: "1h" },
      );

      const response = await fetch(`http://localhost:${port}/test`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: "123",
        email: "test@example.com",
        role: "user",
      });
    });
  });

  describe("API Key Authentication", () => {
    it("should protect routes with API key authentication", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 0,
        auth: {
          enabled: true,
          apiKey: {
            validateKey: async (key: string) => {
              if (key === "valid-api-key") {
                return {
                  id: "api-user",
                  email: "api@example.com",
                  role: "user",
                };
              }
              return null;
            },
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      // Test without API key - should fail
      const response1 = await fetch(`http://localhost:${port}/user`);
      expect(response1.status).toBe(401);

      // Test with valid API key - should succeed
      const response2 = await fetch(`http://localhost:${port}/user`, {
        headers: {
          "x-api-key": "valid-api-key",
        },
      });
      expect(response2.status).toBe(200);
      const data = await response2.json();
      expect(data).toHaveLength(1);
    });

    it("should reject invalid API keys", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 0,
        auth: {
          enabled: true,
          apiKey: {
            validateKey: async (key: string) => {
              return null; // Always invalid
            },
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      const response = await fetch(`http://localhost:${port}/user`, {
        headers: {
          "x-api-key": "invalid-key",
        },
      });
      expect(response.status).toBe(401);
    });
  });

  describe("Custom Routes Authentication", () => {
    it("should protect custom routes with JWT-only requirement", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 0,
        auth: {
          enabled: true,
          jwt: {
            secret: "test-secret",
          },
          apiKey: {
            validateKey: async (key: string) => {
              return key === "valid-key"
                ? { id: "1", email: "test@example.com" }
                : null;
            },
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      // Test JWT-only route with API key - should fail
      const response1 = await fetch(`http://localhost:${port}/user/profile`, {
        headers: {
          "x-api-key": "valid-key",
        },
      });
      expect(response1.status).toBe(401);

      // Test JWT-only route with JWT - should succeed
      const token = jwt.sign(
        { sub: "123", email: "test@example.com", role: "user" },
        "test-secret",
        { expiresIn: "1h" },
      );

      const response2 = await fetch(`http://localhost:${port}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      expect(response2.status).toBe(200);
    });

    it("should allow public custom routes without authentication", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 0,
        auth: {
          enabled: true,
          jwt: {
            secret: "test-secret",
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      // Test public route without auth - should succeed
      const response = await fetch(`http://localhost:${port}/user/public`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Public endpoint");
    });
  });

  describe("Error Handling", () => {
    it("should return standardized auth error responses", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 0,
        auth: {
          enabled: true,
          jwt: {
            secret: "test-secret",
          },
        },
      };

      await startServer(fastify, options);
      const port = fastify.server.address()?.port;

      // Test missing auth
      const response1 = await fetch(`http://localhost:${port}/user`);
      expect(response1.status).toBe(401);
      const error1 = await response1.json();
      expect(error1).toHaveProperty("error");
      expect(error1.error).toBe("Authentication required");

      // Test invalid token
      const response2 = await fetch(`http://localhost:${port}/user`, {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });
      expect(response2.status).toBe(401);
      const error2 = await response2.json();
      expect(error2).toHaveProperty("error");
    });
  });
});
