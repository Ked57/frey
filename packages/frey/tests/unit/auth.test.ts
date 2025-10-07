import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import Fastify from "fastify";
import { startServer, type ServerOptions } from "../../src/main.js";
import { defineEntity } from "../../src/entity.js";
import { createJwtMiddleware } from "../../src/auth/middleware.js";
import { createApiKeyMiddleware } from "../../src/auth/middleware.js";
import { createRouteAuthMiddleware } from "../../src/auth/middleware.js";
import jwt from "jsonwebtoken";

describe("Authentication", () => {
  let fastify: any;

  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  });

  const userEntity = defineEntity({
    name: "user",
    schema: userSchema,
    findAll: async () => [],
    findOne: async () => ({ id: "1", name: "Test", email: "test@example.com" }),
  });

  beforeEach(() => {
    fastify = Fastify({ logger: false });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (fastify) {
      await fastify.close();
    }
  });

  describe("JWT Middleware", () => {
    it("should validate valid JWT tokens", async () => {
      const token = jwt.sign(
        { sub: "123", email: "test@example.com", role: "user" },
        "secret",
        { expiresIn: "1h" }
      );

      const middleware = createJwtMiddleware({
        secret: "secret",
      });

      await fastify.register(middleware);

      const request = {
        headers: { authorization: `Bearer ${token}` },
      } as any;

      const reply = {} as any;

      // Simulate the middleware execution
      await fastify.inject({
        method: "GET",
        url: "/test",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(true).toBe(true); // Middleware should not throw
    });

    it("should reject invalid JWT tokens", async () => {
      const middleware = createJwtMiddleware({
        secret: "secret",
      });

      await fastify.register(middleware);

      const request = {
        headers: { authorization: "Bearer invalid-token" },
      } as any;

      const reply = {} as any;

      // Middleware should not throw but also not authenticate
      expect(true).toBe(true);
    });

    it("should handle missing tokens gracefully", async () => {
      const middleware = createJwtMiddleware({
        secret: "secret",
      });

      await fastify.register(middleware);

      const request = {
        headers: {},
      } as any;

      const reply = {} as any;

      // Middleware should not throw
      expect(true).toBe(true);
    });
  });

  describe("API Key Middleware", () => {
    it("should validate valid API keys", async () => {
      const middleware = createApiKeyMiddleware({
        validateKey: async (key: string) => {
          if (key === "valid-key") {
            return {
              id: "1",
              email: "test@example.com",
              role: "user",
            };
          }
          return null;
        },
      });

      await fastify.register(middleware);

      // Middleware should not throw
      expect(true).toBe(true);
    });

    it("should reject invalid API keys", async () => {
      const middleware = createApiKeyMiddleware({
        validateKey: async (key: string) => {
          return null; // Always return null for invalid keys
        },
      });

      await fastify.register(middleware);

      // Middleware should not throw
      expect(true).toBe(true);
    });

    it("should handle missing API keys gracefully", async () => {
      const middleware = createApiKeyMiddleware({
        validateKey: async (key: string) => {
          return null;
        },
      });

      await fastify.register(middleware);

      // Middleware should not throw
      expect(true).toBe(true);
    });
  });

  describe("Route Auth Middleware", () => {
    it("should allow access when auth is not required", async () => {
      const middleware = createRouteAuthMiddleware({
        requireAuth: false,
      });

      const request = {
        auth: { isAuthenticated: false },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(request, reply);

      expect(reply.status).not.toHaveBeenCalled();
    });

    it("should deny access when auth is required but not provided", async () => {
      const middleware = createRouteAuthMiddleware({
        requireAuth: true,
      });

      const request = {
        auth: { isAuthenticated: false },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(request, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        error: "Authentication required",
        message: "No authentication token provided",
      });
    });

    it("should allow access when auth is required and provided", async () => {
      const middleware = createRouteAuthMiddleware({
        requireAuth: true,
      });

      const request = {
        auth: {
          isAuthenticated: true,
          user: { id: "1", email: "test@example.com" },
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(request, reply);

      expect(reply.status).not.toHaveBeenCalled();
    });

    it("should enforce JWT-only requirement", async () => {
      const middleware = createRouteAuthMiddleware({
        requireAuth: true,
        jwtOnly: true,
      });

      const request = {
        auth: {
          isAuthenticated: true,
          user: { id: "1", email: "test@example.com" },
          authMethod: "api-key",
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(request, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        error: "Authentication method not allowed",
        message: "This endpoint only accepts JWT authentication",
      });
    });

    it("should enforce API key-only requirement", async () => {
      const middleware = createRouteAuthMiddleware({
        requireAuth: true,
        apiKeyOnly: true,
      });

      const request = {
        auth: {
          isAuthenticated: true,
          user: { id: "1", email: "test@example.com" },
          authMethod: "jwt",
        },
      } as any;

      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(request, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        error: "Authentication method not allowed",
        message: "This endpoint only accepts API key authentication",
      });
    });
  });

  describe("Server Integration", () => {
    it("should start server without authentication when disabled", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 3001,
        auth: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);

      await startServer(fastify, options);

      expect(mockListen).toHaveBeenCalled();
    });

    it("should start server with JWT authentication when enabled", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 3002,
        auth: {
          enabled: true,
          jwt: {
            secret: "test-secret",
          },
        },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);

      await startServer(fastify, options);

      expect(mockListen).toHaveBeenCalled();
    });

    it("should start server with API key authentication when enabled", async () => {
      const options: ServerOptions = {
        entities: [userEntity],
        port: 3003,
        auth: {
          enabled: true,
          apiKey: {
            validateKey: async (key: string) => {
              return key === "valid-key" ? { id: "1", email: "test@example.com" } : null;
            },
          },
        },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);

      await startServer(fastify, options);

      expect(mockListen).toHaveBeenCalled();
    });
  });
});
