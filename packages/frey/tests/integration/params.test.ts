import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import Fastify from "fastify";
import { startServer, type ServerOptions } from "../../src/main.js";
import { defineEntity } from "../../src/entity.js";

describe("Parameter Passing Tests", () => {
  let fastify: any;
  let receivedParams: any = null;
  let receivedContext: any = null;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    receivedParams = null;
    receivedContext = null;
  });

  afterEach(async () => {
    if (fastify) {
      await fastify.close();
    }
  });

  describe("Query Parameters", () => {
    it("should pass query parameters to findAll", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        findAll: async (params, context) => {
          receivedParams = params;
          receivedContext = context;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3001,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      // Get the registered route handler
      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;
      expect(findAllHandler).toBeDefined();

      // Test with query parameters
      const mockRequest = {
        params: {},
        query: {
          name: "John",
          email: "john@example.com",
          sort: "name",
          search: "john",
        },
        headers: {},
        url: "/user?name=John&email=john@example.com&sort=name&search=john",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      // Verify params were passed correctly
      expect(receivedParams).toBeDefined();
      expect(receivedParams).toEqual({
        name: "John",
        email: "john@example.com",
        sort: "name",
        search: "john",
      });

      // Verify context was passed correctly
      expect(receivedContext).toBeDefined();
      expect(receivedContext.request).toBe(mockRequest);
      expect(receivedContext.server).toBe(fastify);
    });

    it("should handle empty query parameters", async () => {
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
          receivedParams = params;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3002,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: {},
        headers: {},
        url: "/user",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      expect(receivedParams).toEqual({});
    });

    it("should handle multiple query parameters of same name", async () => {
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
          receivedParams = params;
          return [];
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

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: {
          filter: ["name", "email"],
          sort: ["name", "createdAt"],
        },
        headers: {},
        url: "/user?filter=name&filter=email&sort=name&sort=createdAt",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      expect(receivedParams).toEqual({
        filter: ["name", "email"],
        sort: ["name", "createdAt"],
      });
    });
  });

  describe("Path Parameters", () => {
    it("should pass path parameters to findOne", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: async () => [],
        findOne: async (id, context) => {
          receivedParams = id;
          receivedContext = context;
          return { id: "123", name: "John", email: "john@example.com" };
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

      const findOneHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user/:id",
      )?.[1] as any;
      expect(findOneHandler).toBeDefined();

      const mockRequest = {
        params: { id: "123" },
        query: {},
        headers: {},
        url: "/user/123",
      };
      const mockReply = { send: vi.fn() };

      await findOneHandler(mockRequest, mockReply);

      // Verify the ID was passed correctly
      expect(receivedParams).toEqual({ id: 123 });

      // Verify context was passed correctly
      expect(receivedContext).toBeDefined();
      expect(receivedContext.request).toBe(mockRequest);
      expect(receivedContext.server).toBe(fastify);
    });

    it("should handle custom ID field in path parameters", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          uuid: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        customId: "uuid",
        findAll: async () => [],
        findOne: async (uuid, context) => {
          receivedParams = uuid;
          receivedContext = context;
          return { uuid: "abc-123", name: "John", email: "john@example.com" };
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3005,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findOneHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user/:uuid",
      )?.[1] as any;
      expect(findOneHandler).toBeDefined();

      const mockRequest = {
        params: { uuid: "abc-123" },
        query: {},
        headers: {},
        url: "/user/abc-123",
      };
      const mockReply = { send: vi.fn() };

      await findOneHandler(mockRequest, mockReply);

      // Verify the UUID was passed correctly
      expect(receivedParams).toEqual({ id: "abc-123" });

      // Verify context was passed correctly
      expect(receivedContext).toBeDefined();
      expect(receivedContext.request).toBe(mockRequest);
      expect(receivedContext.server).toBe(fastify);
    });
  });

  describe("Request Context", () => {
    it("should pass complete request object in context", async () => {
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
          receivedContext = context;
          return [];
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

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: { name: "John" },
        headers: {
          authorization: "Bearer token123",
          "user-agent": "Test Agent",
          "content-type": "application/json",
        },
        url: "/user?name=John",
        method: "GET",
        ip: "127.0.0.1",
        hostname: "localhost",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      // Verify complete request object is available
      expect(receivedContext.request).toBe(mockRequest);
      expect(receivedContext.request.headers).toEqual({
        authorization: "Bearer token123",
        "user-agent": "Test Agent",
        "content-type": "application/json",
      });
      expect(receivedContext.request.url).toBe("/user?name=John");
      expect(receivedContext.request.method).toBe("GET");
      expect(receivedContext.request.ip).toBe("127.0.0.1");
    });

    it("should pass server instance in context", async () => {
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
          receivedContext = context;
          return [];
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

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: {},
        headers: {},
        url: "/user",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      // Verify server instance is available
      expect(receivedContext.server).toBe(fastify);
      expect(receivedContext.server).toBeInstanceOf(Object);
      expect(typeof receivedContext.server.get).toBe("function");
      expect(typeof receivedContext.server.post).toBe("function");
    });

    it("should pass context to findOne function", async () => {
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
        findAll: async () => [],
        findOne: async (id, context) => {
          receivedContext = context;
          return { id: "123", name: "John" };
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3008,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findOneHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user/:id",
      )?.[1] as any;

      const mockRequest = {
        params: { id: "123" },
        query: {},
        headers: { authorization: "Bearer token456" },
        url: "/user/123",
        method: "GET",
      };
      const mockReply = { send: vi.fn() };

      await findOneHandler(mockRequest, mockReply);

      // Verify context is passed to findOne
      expect(receivedContext).toBeDefined();
      expect(receivedContext.request).toBe(mockRequest);
      expect(receivedContext.server).toBe(fastify);
      expect(receivedContext.request.headers.authorization).toBe(
        "Bearer token456",
      );
    });

    it("should pass context with custom ID field", async () => {
      const userEntity = defineEntity({
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
        findAll: async () => [],
        findOne: async (uuid, context) => {
          receivedContext = context;
          return { uuid: "abc-123", name: "John" };
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3009,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findOneHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user/:uuid",
      )?.[1] as any;

      const mockRequest = {
        params: { uuid: "abc-123" },
        query: {},
        headers: { "x-tenant-id": "company-123" },
        url: "/user/abc-123",
        method: "GET",
      };
      const mockReply = { send: vi.fn() };

      await findOneHandler(mockRequest, mockReply);

      // Verify context is passed with custom ID
      expect(receivedContext).toBeDefined();
      expect(receivedContext.request).toBe(mockRequest);
      expect(receivedContext.server).toBe(fastify);
      expect(receivedContext.request.params.uuid).toBe("abc-123");
      expect(receivedContext.request.headers["x-tenant-id"]).toBe(
        "company-123",
      );
    });

    it("should pass context with query parameters", async () => {
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
          receivedContext = context;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3010,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: { name: "John", page: "1", limit: "10" },
        headers: { "content-type": "application/json" },
        url: "/user?name=John&page=1&limit=10",
        method: "GET",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      // Verify context includes query parameters
      expect(receivedContext).toBeDefined();
      expect(receivedContext.request).toBe(mockRequest);
      expect(receivedContext.server).toBe(fastify);
      expect(receivedContext.request.query).toEqual({
        name: "John",
        page: "1",
        limit: "10",
      });
      expect(receivedContext.request.url).toBe(
        "/user?name=John&page=1&limit=10",
      );
    });
  });

  describe("Custom Parameters", () => {
    it("should handle custom parameters when customParams is defined", async () => {
      const userEntity = defineEntity({
        name: "user",
        schema: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        params: {
          filters: ["name", "email"],
          sorts: ["name", "email"],
          search: ["name", "email"],
        },
        customParams: ["page", "limit", "include"],
        findAll: async (params, context) => {
          receivedParams = params;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3011,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;
      expect(findAllHandler).toBeDefined();

      const mockRequest = {
        params: {},
        query: {
          page: "1",
          limit: "10",
          include: "profile,settings",
          name: "John", // This should still work with default params
        },
        headers: {},
        url: "/user?page=1&limit=10&include=profile,settings&name=John",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      // Verify all parameters are passed (both default and custom)
      expect(receivedParams).toEqual({
        page: 1,
        limit: 10,
        include: "profile,settings",
        name: "John",
      });
    });

    it("should work with only custom parameters", async () => {
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
        customParams: ["page", "limit", "sortBy", "sortOrder"],
        findAll: async (params, context) => {
          receivedParams = params;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3012,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;
      expect(findAllHandler).toBeDefined();

      const mockRequest = {
        params: {},
        query: {
          page: "2",
          limit: "20",
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        headers: {},
        url: "/user?page=2&limit=20&sortBy=createdAt&sortOrder=desc",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      expect(receivedParams).toEqual({
        page: 2,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    });
  });

  describe("Parameter Types", () => {
    it("should handle string parameters", async () => {
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
          receivedParams = params;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3008,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: {
          name: "John Doe",
          email: "john@example.com",
          age: "25",
        },
        headers: {},
        url: "/user?name=John%20Doe&email=john@example.com&age=25",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      expect(receivedParams).toEqual({
        name: "John Doe",
        email: "john@example.com",
        age: 25,
      });
    });

    it("should handle numeric parameters", async () => {
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
          receivedParams = params;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3009,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: {
          page: "1",
          limit: "10",
          offset: "20",
        },
        headers: {},
        url: "/user?page=1&limit=10&offset=20",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      expect(receivedParams).toEqual({
        page: 1,
        limit: 10,
        offset: 20,
      });
    });

    it("should handle boolean parameters", async () => {
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
          receivedParams = params;
          return [];
        },
      });

      const serverOptions: ServerOptions = {
        entities: [userEntity],
        port: 3010,
      };

      const mockListen = vi
        .spyOn(fastify, "listen")
        .mockResolvedValue(undefined);
      const mockGet = vi.spyOn(fastify, "get");

      await startServer(fastify, serverOptions);

      const findAllHandler = mockGet.mock.calls.find(
        (call) => call[0] === "/user",
      )?.[1] as any;

      const mockRequest = {
        params: {},
        query: {
          active: "true",
          verified: "false",
          premium: "1",
        },
        headers: {},
        url: "/user?active=true&verified=false&premium=1",
      };
      const mockReply = { send: vi.fn() };

      await findAllHandler(mockRequest, mockReply);

      expect(receivedParams).toEqual({
        active: true,
        verified: false,
        premium: 1,
      });
    });
  });
});
