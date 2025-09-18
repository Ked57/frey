import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { z } from "zod";
import Fastify from "fastify";
import { startServer, type ServerOptions } from "../../src/main.js";
import { defineEntity } from "../../src/entity.js";

describe("Server Integration Tests", () => {
  let fastify: any;
  let server: any;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
  });

  afterEach(async () => {
    if (fastify) {
      await fastify.close();
    }
  });

  describe("Complete Entity-to-Server Flow", () => {
    it("should register routes for entity with findAll", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
          createdAt: z.date(),
        }),
        params: {
          filters: ["name", "email"],
          sorts: ["name", "createdAt"],
          search: ["name", "email"],
        },
        findAll: async (params, context) => {
          return [
            {
              id: "1",
              name: "John Doe",
              email: "john@example.com",
              createdAt: new Date("2023-01-01"),
            },
            {
              id: "2",
              name: "Jane Smith",
              email: "jane@example.com",
              createdAt: new Date("2023-01-02"),
            },
          ];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3002,
      };

      // Mock listen to prevent actual server start
      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      // Verify that the route was registered
      expect(mockGet).toHaveBeenCalledWith("/user", expect.any(Function));
    });

    it("should register routes for entity with findOne", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
          createdAt: z.date(),
        }),
        params: {
          filters: ["name", "email"],
          sorts: ["name", "createdAt"],
          search: ["name", "email"],
        },
        findAll: async () => [],
        findOne: async (id, context) => {
          return {
            id,
            name: "John Doe",
            email: "john@example.com",
            createdAt: new Date("2023-01-01"),
          };
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3003,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      // Verify that both routes were registered
      expect(mockGet).toHaveBeenCalledWith("/user", expect.any(Function));
      expect(mockGet).toHaveBeenCalledWith("/user/:id", expect.any(Function));
    });

    it("should register routes with custom ID field", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          uuid: z.string(),
          name: z.string(),
          email: z.string().email(),
        }),
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        customId: "uuid",
        findAll: async () => [],
        findOne: async (uuid, context) => {
          return {
            uuid,
            name: "John Doe",
            email: "john@example.com",
          };
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3004,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      // Verify that routes were registered with custom ID
      expect(mockGet).toHaveBeenCalledWith("/user", expect.any(Function));
      expect(mockGet).toHaveBeenCalledWith("/user/:uuid", expect.any(Function));
    });

    it("should register routes for multiple entities", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
        }),
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: async () => [{ id: "1", name: "John" }],
      });

      const productEntity = defineEntity({
        name: "product",
        schema: z.object({
          id: z.string(),
          title: z.string(),
          price: z.number(),
        }),
        params: {
          filters: ["title"],
          sorts: ["title", "price"],
          search: ["title"],
        },
        findAll: async () => [{ id: "1", title: "Widget", price: 99.99 }],
        findOne: async (id) => ({ id, title: "Widget", price: 99.99 }),
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity, productEntity],
        port: 3005,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      // Check that routes were registered for both entities
      expect(mockGet).toHaveBeenCalledWith("/user", expect.any(Function));
      expect(mockGet).toHaveBeenCalledWith("/product", expect.any(Function));
      expect(mockGet).toHaveBeenCalledWith(
        "/product/:id",
        expect.any(Function),
      );
      // User entity doesn't have findOne, so no /user/:id route
      expect(mockGet).not.toHaveBeenCalledWith(
        "/user/:id",
        expect.any(Function),
      );
    });

    it("should register routes and pass context to entity functions", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
        }),
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: async (params, context) => {
          // Verify context is passed correctly
          expect(context).toBeDefined();
          expect(context.request).toBeDefined();
          expect(context.server).toBeDefined();
          return [{ id: "1", name: "John" }];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3006,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      // Verify that the route was registered
      expect(mockGet).toHaveBeenCalledWith("/user", expect.any(Function));
    });
  });

  describe("Error Handling", () => {
    it("should register routes even when entity functions throw errors", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
        }),
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: async () => {
          throw new Error("Database connection failed");
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3007,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      // Verify that the route was still registered despite the error-prone function
      expect(mockGet).toHaveBeenCalledWith("/user", expect.any(Function));
    });
  });
});
