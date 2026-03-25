import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("cache integration", () => {
  it("returns cached findAll response when cache is enabled", async () => {
    const findAll = vi.fn(async () => [{ id: "1", name: "John" }]);
    const entity = defineEntity({
      name: "user",
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      findAll,
    });

    const { app } = await buildTestApp({
      entities: [entity] as const,
      cache: { enabled: true },
      swagger: { enabled: false },
    });

    const first = await app.inject({ method: "GET", url: "/user" });
    const second = await app.inject({ method: "GET", url: "/user" });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(findAll).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it("does not cache when cache is disabled", async () => {
    const findAll = vi.fn(async () => [{ id: "1", name: "John" }]);
    const entity = defineEntity({
      name: "user",
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      findAll,
    });

    const { app } = await buildTestApp({
      entities: [entity] as const,
      cache: { enabled: false },
      swagger: { enabled: false },
    });

    await app.inject({ method: "GET", url: "/user?status=active" });
    await app.inject({ method: "GET", url: "/user" });

    expect(findAll).toHaveBeenCalledTimes(2);
    await app.close();
  });

  it("invalidates list cache after command operations", async () => {
    const findAll = vi.fn(async () => [{ id: "1", name: "John" }]);
    const create = vi.fn(async () => ({ id: "2", name: "Jane" }));
    const entity = defineEntity({
      name: "user",
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      findAll,
      create,
    });

    const { app } = await buildTestApp({
      entities: [entity] as const,
      cache: { enabled: true },
      swagger: { enabled: false },
    });

    await app.inject({ method: "GET", url: "/user" });
    await app.inject({
      method: "POST",
      url: "/user",
      payload: { id: "2", name: "Jane" },
    });
    await app.inject({ method: "GET", url: "/user?status=active" });

    expect(findAll).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(1);
    await app.close();
  });
});
