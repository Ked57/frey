import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("API versioning integration", () => {
  const entity = defineEntity({
    name: "user",
    schema: z.object({
      id: z.string(),
      name: z.string(),
    }),
    findAll: async () => [{ id: "1", name: "John" }],
  });

  it("serves routes without a version prefix by default", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
    });

    const response = await app.inject({
      method: "GET",
      url: "/user",
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it("serves entity routes under configured API prefix", async () => {
    const { app } = await buildTestApp({
      entities: [entity] as const,
      apiPrefix: "/v1",
      swagger: { enabled: false },
    });

    const prefixed = await app.inject({
      method: "GET",
      url: "/v1/user",
    });
    const unprefixed = await app.inject({
      method: "GET",
      url: "/user",
    });

    expect(prefixed.statusCode).toBe(200);
    expect(unprefixed.statusCode).toBe(404);
    await app.close();
  });
});
