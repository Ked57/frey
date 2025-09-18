import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import {
  defineEntity,
  type Entity,
  type DefaultParams,
  type Context,
} from "../../src/entity.js";
import type { FastifyInstance, FastifyRequest } from "fastify";

describe("Entity Definition", () => {
  const mockSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.date(),
  });

  const mockContext: Context = {
    request: {} as FastifyRequest,
    server: {} as FastifyInstance,
  };

  describe("defineEntity", () => {
    it("should create a valid entity with all required properties", () => {
      const entity = defineEntity({
        name: "user",
        schema: mockSchema,
        params: {
          filters: ["name", "email"],
          sorts: ["name", "createdAt"],
          search: ["name", "email"],
        },
        findAll: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue({
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          createdAt: new Date(),
        }),
      });

      expect(entity.name).toBe("user");
      expect(entity.schema).toBe(mockSchema);
      expect(entity.params).toEqual({
        filters: ["name", "email"],
        sorts: ["name", "createdAt"],
        search: ["name", "email"],
      });
      expect(typeof entity.findAll).toBe("function");
      expect(typeof entity.findOne).toBe("function");
    });

    it("should create entity with custom ID field", () => {
      const entity = defineEntity({
        name: "product",
        schema: mockSchema,
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        customId: "uuid",
        findAll: vi.fn().mockResolvedValue([]),
      });

      expect(entity.customId).toBe("uuid");
    });

    it("should create entity with all CRUD operations", () => {
      const mockData = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        createdAt: new Date(),
      };

      const entity = defineEntity({
        name: "user",
        schema: mockSchema,
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: vi.fn().mockResolvedValue([mockData]),
        findOne: vi.fn().mockResolvedValue(mockData),
        create: vi.fn().mockResolvedValue(mockData),
        update: vi.fn().mockResolvedValue(mockData),
        delete: vi.fn().mockResolvedValue(undefined),
      });

      expect(typeof entity.findAll).toBe("function");
      expect(typeof entity.findOne).toBe("function");
      expect(typeof entity.create).toBe("function");
      expect(typeof entity.update).toBe("function");
      expect(typeof entity.delete).toBe("function");
    });

    it("should preserve schema type information", () => {
      const entity = defineEntity({
        name: "user",
        schema: mockSchema,
        params: {
          filters: ["name", "email"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: vi.fn().mockResolvedValue([]),
      });

      // The schema should be preserved as a ZodObject
      expect(entity.schema).toBeInstanceOf(z.ZodObject);
      expect(entity.schema.shape).toEqual(mockSchema.shape);
    });
  });

  describe("Entity Types", () => {
    it("should correctly type DefaultParams", () => {
      const params: DefaultParams<typeof mockSchema> = {
        filters: ["name", "email"],
        sorts: ["name", "createdAt"],
        search: ["name", "email"],
        order: ["name"],
      };

      expect(params.filters).toEqual(["name", "email"]);
      expect(params.sorts).toEqual(["name", "createdAt"]);
      expect(params.search).toEqual(["name", "email"]);
      expect(params.order).toEqual(["name"]);
    });

    it("should allow empty params", () => {
      const params: DefaultParams<typeof mockSchema> = {};

      expect(params.filters).toBeUndefined();
      expect(params.sorts).toBeUndefined();
      expect(params.search).toBeUndefined();
      expect(params.order).toBeUndefined();
    });
  });

  describe("Entity Function Execution", () => {
    it("should execute findAll with correct parameters", async () => {
      const mockFindAll = vi.fn().mockResolvedValue([]);

      const entity = defineEntity({
        name: "user",
        schema: mockSchema,
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: mockFindAll,
      });

      const testParams = { filters: ["name"], sorts: ["name"] };
      await entity.findAll(testParams, mockContext);

      expect(mockFindAll).toHaveBeenCalledWith(testParams, mockContext);
    });

    it("should execute findOne with correct parameters", async () => {
      const mockFindOne = vi.fn().mockResolvedValue({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
      });

      const entity = defineEntity({
        name: "user",
        schema: mockSchema,
        params: {
          filters: ["name"],
          sorts: ["name"],
          search: ["name"],
        },
        findAll: vi.fn().mockResolvedValue([]),
        findOne: mockFindOne,
      });

      const testParam = "1";
      await entity.findOne!(testParam, mockContext);

      expect(mockFindOne).toHaveBeenCalledWith(testParam, mockContext);
    });
  });
});
