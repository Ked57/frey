import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("health endpoints integration", () => {
  const entity = defineEntity({
    name: "user",
    schema: z.object({
      id: z.string(),
      name: z.string(),
    }),
    findAll: async () => [{ id: "1", name: "John" }],
  });

  it("returns liveness at /health/live", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      health: { enabled: true },
    });

    const response = await app.inject({
      method: "GET",
      url: "/health/live",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      check: "liveness",
    });
    await app.close();
  });

  it("returns readiness at /health/ready", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      health: { enabled: true },
    });

    const response = await app.inject({
      method: "GET",
      url: "/health/ready",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      check: "readiness",
    });
    await app.close();
  });
});
