import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity, createTestApp } from "../../src/index.js";

describe("public testing utilities", () => {
  it("exports createTestApp and registers routes without listen side effects", async () => {
    const entity = defineEntity({
      name: "user",
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      findAll: async () => [{ id: "1", name: "John" }],
    });

    const { app } = await createTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
    });

    const response = await app.inject({
      method: "GET",
      url: "/user",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: "1", name: "John" }]);
    await app.close();
  });
});
