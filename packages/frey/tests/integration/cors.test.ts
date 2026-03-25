import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("CORS integration", () => {
  const entity = defineEntity({
    name: "user",
    schema: z.object({
      id: z.string(),
      name: z.string(),
    }),
    findAll: async () => [{ id: "1", name: "John" }],
  });

  it("does not include CORS headers when cors is disabled", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      cors: { enabled: false },
      swagger: { enabled: false },
    });

    const response = await app.inject({
      method: "GET",
      url: "/user",
      headers: {
        origin: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    await app.close();
  });

  it("includes CORS headers when cors is enabled", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      cors: {
        enabled: true,
        origin: "https://example.com",
      },
      swagger: { enabled: false },
    });

    const response = await app.inject({
      method: "GET",
      url: "/user",
      headers: {
        origin: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://example.com",
    );
    await app.close();
  });
});
