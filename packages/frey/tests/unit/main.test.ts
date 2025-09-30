import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import Fastify from "fastify";
import { startServer, type ServerOptions } from "../../src/main.js";
import { defineEntity, type Entity } from "../../src/entity.js";

// Mock the process.exit to prevent actual exit during tests
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit called");
});

describe("Server Setup", () => {
  let fastify: any;
  let mockEntity: Entity<z.ZodObject<Record<string, z.ZodTypeAny>>>;

  beforeEach(() => {
    fastify = Fastify({ logger: false });

    mockEntity = defineEntity({
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
      findAll: vi.fn().mockResolvedValue([
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          createdAt: new Date(),
        },
      ]),
      findOne: vi.fn().mockResolvedValue({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
      }),
    });
  });

  afterEach(async () => {
    if (fastify) {
      await fastify.close();
    }
    vi.clearAllMocks();
  });

  describe("startServer", () => {
    it("should register routes for entities", async () => {
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        port: 3001,
      };

      // Mock fastify.listen to prevent actual server start
      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);

      await startServer(fastify, serverOptions);

      expect(mockListen).toHaveBeenCalledWith({
        port: 3001,
        host: undefined,
      });
    });

    it("should use default port when not specified", async () => {
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);

      await startServer(fastify, serverOptions);

      expect(mockListen).toHaveBeenCalledWith({
        port: 3000,
        host: undefined,
      });
    });

    it("should use custom host when specified", async () => {
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        port: 3001,
        host: "0.0.0.0",
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);

      await startServer(fastify, serverOptions);

      expect(mockListen).toHaveBeenCalledWith({
        port: 3001,
        host: "0.0.0.0",
      });
    });

    it("should handle multiple entities", async () => {
      const secondEntity = defineEntity({
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
        findAll: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue({
          id: "1",
          title: "Test Product",
          price: 99.99,
        }),
      });

      const serverOptions: ServerOptions = {
        entities: [mockEntity, secondEntity],
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);

      await startServer(fastify, serverOptions);

      expect(mockListen).toHaveBeenCalledWith({
        port: 3000,
        host: undefined,
      });
    });

    it("should handle server start error", async () => {
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockRejectedValue(new Error("Port already in use"));
      const mockLogError = vi.spyOn(fastify.log, "error");

      await expect(startServer(fastify, serverOptions)).rejects.toThrow(
        "process.exit called",
      );
      expect(mockLogError).toHaveBeenCalledWith(
        new Error("Port already in use"),
      );
    });
  });

  describe("Route Registration", () => {
    it("should register GET route for findAll", async () => {
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      expect(mockGet).toHaveBeenCalledWith("/user", expect.objectContaining({
        schema: expect.objectContaining({
          summary: "Get all users",
          tags: ["user"],
        }),
      }), expect.any(Function));
    });

    it("should register GET route for findOne when findOne function exists", async () => {
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      expect(mockGet).toHaveBeenCalledWith("/user/:id", expect.objectContaining({
        schema: expect.objectContaining({
          summary: "Get a user by ID",
          tags: ["user"],
        }),
      }), expect.any(Function));
    });

    it("should not register findOne route when findOne function is missing", async () => {
      const entityWithoutFindOne = defineEntity({
        name: "product",
        schema: z.object({
          id: z.string(),
          title: z.string(),
        }),
        params: {
          filters: ["title"],
          sorts: ["title"],
          search: ["title"],
        },
        findAll: vi.fn().mockResolvedValue([]),
        // No findOne function
      });

      const serverOptions: ServerOptions = {
        entities: [entityWithoutFindOne],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");
      const mockLogError = vi.spyOn(fastify.log, "error");

      await startServer(fastify, serverOptions);

      // Should only register findAll route
      expect(mockGet).toHaveBeenCalledWith("/product", expect.objectContaining({
        schema: expect.objectContaining({
          summary: "Get all products",
          tags: ["product"],
        }),
      }), expect.any(Function));
      expect(mockGet).not.toHaveBeenCalledWith(
        "/product/:id",
        expect.any(Object),
        expect.any(Function),
      );
      expect(mockLogError).toHaveBeenCalledWith(
        "Entity product does not have a findOne function",
      );
    });

    it("should register findOne route with custom ID field", async () => {
      const entityWithCustomId = defineEntity({
        name: "user",
        schema: z.object({
          uuid: z.string(),
          name: z.string(),
        }),
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        customId: "uuid",
        findAll: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue({
          uuid: "123",
          name: "John Doe",
        }),
      });

      const serverOptions: ServerOptions = {
        entities: [entityWithCustomId],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      expect(mockGet).toHaveBeenCalledWith("/user/:uuid", expect.objectContaining({
        schema: expect.objectContaining({
          summary: "Get a user by ID",
          tags: ["user"],
        }),
      }), expect.any(Function));
    });
  });

  describe("Route Handlers", () => {
    it("should register findAll route handler", async () => {
      const mockGet = vi.spyOn(fastify, "get");
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      await startServer(fastify, serverOptions);

      // Check that the route was registered with schema
      expect(mockGet).toHaveBeenCalledWith("/user", expect.objectContaining({
        schema: expect.objectContaining({
          summary: "Get all users",
          tags: ["user"],
        }),
      }), expect.any(Function));
    });

    it("should register findOne route handler", async () => {
      const mockGet = vi.spyOn(fastify, "get");
      const serverOptions: ServerOptions = {
        entities: [mockEntity],
        swagger: { enabled: false },
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      await startServer(fastify, serverOptions);

      // Check that the route was registered with schema
      expect(mockGet).toHaveBeenCalledWith("/user/:id", expect.objectContaining({
        schema: expect.objectContaining({
          summary: "Get a user by ID",
          tags: ["user"],
        }),
      }), expect.any(Function));
    });
  });
});
