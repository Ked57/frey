import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import { z } from "zod";
import type { Entity } from "../../src/entity.js";
import { defineEntity } from "../../src/entity.js";
import { registerFrey } from "../../src/main.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("registerFrey integration", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>["app"];
  let entity: Entity<z.ZodObject<any>>;
  let findAll: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findAll = vi.fn(async () => [{ id: "1", name: "John" }]);

    entity = defineEntity({
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
        // Delegate to spy so we can assert call args outside of Fastify handler.
        return findAll(params, context);
      },
    });

    const result = await buildTestApp({
      entities: [entity],
      swagger: { enabled: false },
    });
    app = result.app;
  });

  afterEach(async () => {
    await app.close();
  });

  it("serves registered routes via app.inject without listen side effects", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/user?name=John",
    });

    expect(response.statusCode).toBe(200);

    const payload = JSON.parse(response.payload);
    expect(payload).toEqual([{ id: "1", name: "John" }]);

    expect(findAll).toHaveBeenCalledTimes(1);

    const [paramsArg, contextArg] = findAll.mock.calls[0] as [
      unknown,
      unknown,
    ];
    expect(paramsArg).toMatchObject({ name: "John" });
    expect((contextArg as any).auth).toMatchObject({ isAuthenticated: false });
  });
});

describe("registerFrey()", () => {
  it("does not call fastify.listen during registration-only setup", async () => {
    const app = Fastify({ logger: false });
    const listenSpy = vi
      .spyOn(app, "listen")
      .mockImplementation(() => {
        throw new Error("fastify.listen called");
      });

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
      findAll: vi.fn().mockResolvedValue([{ id: "1", name: "John" }]),
    });

    await registerFrey(app, {
      entities: [userEntity],
      swagger: { enabled: false },
      auth: undefined,
    });

    expect(listenSpy).not.toHaveBeenCalled();
    await app.close();
  });
});

