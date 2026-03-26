import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("rate limit integration", () => {
  const entity = defineEntity({
    name: "user",
    schema: z.object({
      id: z.string(),
      name: z.string(),
    }),
    findAll: async () => [{ id: "1", name: "John" }],
  });

  it("does not rate limit when disabled", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      rateLimit: { enabled: false, max: 1, timeWindow: "1 minute" },
    });

    const first = await app.inject({ method: "GET", url: "/user" });
    const second = await app.inject({ method: "GET", url: "/user" });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    await app.close();
  });

  it("returns 429 when enabled and limit exceeded", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      rateLimit: { enabled: true, max: 1, timeWindow: "1 minute" },
    });

    const first = await app.inject({ method: "GET", url: "/user" });
    const second = await app.inject({ method: "GET", url: "/user" });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(429);
    await app.close();
  });
});
