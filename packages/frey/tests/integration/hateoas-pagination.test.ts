import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";

describe("HATEOAS pagination link metadata", () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  it("adds Link header with rel=\"next\" when limit/offset indicate another page", async () => {
    const entity = defineEntity({
      name: "user",
      schema: userSchema,
      params: {
        filters: ["name"],
        sorts: ["name"],
        search: ["name"],
      },
      findAll: async () => [
        { id: "1", name: "John" },
        { id: "2", name: "Jane" },
      ],
    });

    const result = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      auth: undefined,
    });

    const response = await result.app.inject({
      method: "GET",
      url: "/user?name=John&limit=2&offset=0",
    });

    expect(response.statusCode).toBe(200);

    const link = response.headers["link"];
    expect(link).toContain('rel="next"');
    expect(link).toContain("offset=2");
    expect(link).not.toContain('rel="prev"');
  });

  it("adds Link header with rel=\"prev\" and rel=\"next\" when middle page", async () => {
    const entity = defineEntity({
      name: "user",
      schema: userSchema,
      params: {
        filters: ["name"],
        sorts: ["name"],
        search: ["name"],
      },
      findAll: async () => [
        { id: "3", name: "User3" },
        { id: "4", name: "User4" },
      ],
    });

    const result = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      auth: undefined,
    });

    const response = await result.app.inject({
      method: "GET",
      url: "/user?limit=2&offset=2",
    });

    expect(response.statusCode).toBe(200);

    const link = response.headers["link"];
    expect(link).toContain('rel="prev"');
    expect(link).toContain("offset=0");
    expect(link).toContain('rel="next"');
    expect(link).toContain("offset=4");
  });

  it("omits rel=\"next\" when result length is less than limit", async () => {
    const entity = defineEntity({
      name: "user",
      schema: userSchema,
      params: {
        filters: ["name"],
        sorts: ["name"],
        search: ["name"],
      },
      findAll: async () => [{ id: "1", name: "John" }],
    });

    const result = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      auth: undefined,
    });

    const response = await result.app.inject({
      method: "GET",
      url: "/user?limit=2&offset=0",
    });

    expect(response.statusCode).toBe(200);

    const link = response.headers["link"];
    expect(link).toBeUndefined();
  });

  it("omits Link header entirely when limit is not provided", async () => {
    const entity = defineEntity({
      name: "user",
      schema: userSchema,
      params: {
        filters: ["name"],
        sorts: ["name"],
        search: ["name"],
      },
      findAll: async () => [{ id: "1", name: "John" }],
    });

    const result = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      auth: undefined,
    });

    const response = await result.app.inject({
      method: "GET",
      url: "/user?name=John&offset=10",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["link"]).toBeUndefined();
  });
});

