import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Fastify from "fastify";
import { defineEntity } from "../../src/entity.ts";
import { registerCustomRoutes } from "../../src/routes/custom.ts";

describe("Custom Routes", () => {
  const testSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  });

  const testEntity = defineEntity({
    name: "test",
    schema: testSchema,
    customRoutes: [
      {
        path: "/hello",
        method: "GET",
        registerRoute: async (request, reply, { server, entity }) => {
          reply.send({
            message: "Hello from custom route!",
            entityName: entity.name,
          });
        },
      },
      {
        path: "/echo",
        method: "POST",
        registerRoute: async (request, reply, { server, entity }) => {
          const body = request.body as any;
          reply.send({
            echo: body,
            entityName: entity.name,
          });
        },
      },
    ],
    findAll: async () => [],
  });

  it("should register custom routes correctly", async () => {
    const fastify = Fastify();

    // Register custom routes
    registerCustomRoutes(fastify, testEntity);

    // Test GET /test/hello
    const helloResponse = await fastify.inject({
      method: "GET",
      url: "/test/hello",
    });

    expect(helloResponse.statusCode).toBe(200);
    expect(JSON.parse(helloResponse.body)).toEqual({
      message: "Hello from custom route!",
      entityName: "test",
    });

    // Test POST /test/echo
    const echoResponse = await fastify.inject({
      method: "POST",
      url: "/test/echo",
      payload: { test: "data" },
    });

    expect(echoResponse.statusCode).toBe(200);
    expect(JSON.parse(echoResponse.body)).toEqual({
      echo: { test: "data" },
      entityName: "test",
    });
  });

  it("should handle custom route errors gracefully", async () => {
    const errorEntity = defineEntity({
      name: "error",
      schema: testSchema,
      customRoutes: [
        {
          path: "/error",
          method: "GET",
          registerRoute: async (request, reply, { server, entity }) => {
            throw new Error("Custom route error");
          },
        },
      ],
      findAll: async () => [],
    });

    const fastify = Fastify();
    registerCustomRoutes(fastify, errorEntity);

    const response = await fastify.inject({
      method: "GET",
      url: "/error/error",
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: "Internal server error",
      message: "Custom route error",
    });
  });

  it("should handle entities without custom routes", () => {
    const entityWithoutCustomRoutes = defineEntity({
      name: "simple",
      schema: testSchema,
      findAll: async () => [],
    });

    const fastify = Fastify();

    // Should not throw an error
    expect(() => {
      registerCustomRoutes(fastify, entityWithoutCustomRoutes);
    }).not.toThrow();
  });

  it("should handle empty custom routes array", () => {
    const entityWithEmptyCustomRoutes = defineEntity({
      name: "empty",
      schema: testSchema,
      customRoutes: [],
      findAll: async () => [],
    });

    const fastify = Fastify();

    // Should not throw an error
    expect(() => {
      registerCustomRoutes(fastify, entityWithEmptyCustomRoutes);
    }).not.toThrow();
  });

  it("should support different HTTP methods", async () => {
    const multiMethodEntity = defineEntity({
      name: "multi",
      schema: testSchema,
      customRoutes: [
        {
          path: "/get",
          method: "GET",
          registerRoute: async (request, reply) => {
            reply.send({ method: "GET" });
          },
        },
        {
          path: "/post",
          method: "POST",
          registerRoute: async (request, reply) => {
            reply.send({ method: "POST" });
          },
        },
        {
          path: "/put",
          method: "PUT",
          registerRoute: async (request, reply) => {
            reply.send({ method: "PUT" });
          },
        },
        {
          path: "/delete",
          method: "DELETE",
          registerRoute: async (request, reply) => {
            reply.send({ method: "DELETE" });
          },
        },
      ],
      findAll: async () => [],
    });

    const fastify = Fastify();
    registerCustomRoutes(fastify, multiMethodEntity);

    // Test all methods
    const methods = ["GET", "POST", "PUT", "DELETE"];

    for (const method of methods) {
      const response = await fastify.inject({
        method: method as any,
        url: `/multi/${method.toLowerCase()}`,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ method });
    }
  });

  it("should provide server and entity context to custom routes", async () => {
    const contextEntity = defineEntity({
      name: "context",
      schema: testSchema,
      customRoutes: [
        {
          path: "/context",
          method: "GET",
          registerRoute: async (request, reply, { server, entity }) => {
            reply.send({
              hasServer: !!server,
              entityName: entity.name,
              entitySchema: Object.keys(entity.schema.shape),
            });
          },
        },
      ],
      findAll: async () => [],
    });

    const fastify = Fastify();
    registerCustomRoutes(fastify, contextEntity);

    const response = await fastify.inject({
      method: "GET",
      url: "/context/context",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.hasServer).toBe(true);
    expect(body.entityName).toBe("context");
    expect(body.entitySchema).toEqual(["id", "name", "email"]);
  });
});
