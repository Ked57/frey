import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("OpenAPI export integration", () => {
  const entity = defineEntity({
    name: "user",
    schema: z.object({
      id: z.string(),
      name: z.string(),
    }),
    findAll: async () => [{ id: "1", name: "John" }],
    findOne: async () => ({ id: "1", name: "John" }),
  });

  it("serves OpenAPI JSON at /openapi.json when swagger is enabled", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: true },
    });

    const response = await app.inject({
      method: "GET",
      url: "/openapi.json",
    });

    expect(response.statusCode).toBe(200);
    const json = response.json() as {
      openapi?: string;
      paths?: Record<string, unknown>;
    };
    expect(json.openapi).toBe("3.0.0");
    expect(json.paths).toBeDefined();
    expect(json.paths?.["/user"]).toBeDefined();
    expect(json.paths?.["/user/{id}"]).toBeDefined();
    await app.close();
  });
});
