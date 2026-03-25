import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";
import { createInMemoryCqrsEventBus } from "../../src/cqrs/event-bus.js";
import type { CqrsEvent } from "../../src/cqrs/types.js";

describe("CQRS integration", () => {
  it("publishes query and command events when cqrs is enabled", async () => {
    const events: CqrsEvent[] = [];
    const eventBus = createInMemoryCqrsEventBus();
    eventBus.subscribe((event) => {
      events.push(event);
    });

    const entity = defineEntity({
      name: "user",
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      findAll: async () => [{ id: "1", name: "John" }],
      findOne: async () => ({ id: "1", name: "John" }),
      create: async () => ({ id: "2", name: "Jane" }),
      update: async () => ({ id: "1", name: "Updated" }),
      delete: async () => undefined,
    });

    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      cqrs: {
        enabled: true,
        eventBus,
      },
    });

    await app.inject({ method: "GET", url: "/user" });
    await app.inject({ method: "GET", url: "/user/1" });
    await app.inject({
      method: "POST",
      url: "/user",
      payload: { id: "2", name: "Jane" },
    });
    await app.inject({
      method: "PUT",
      url: "/user/1",
      payload: { id: "1", name: "Updated" },
    });
    await app.inject({ method: "DELETE", url: "/user/1" });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "query.executed",
          entity: "user",
          operation: "findAll",
        }),
        expect.objectContaining({
          type: "query.executed",
          entity: "user",
          operation: "findOne",
        }),
        expect.objectContaining({
          type: "command.executed",
          entity: "user",
          operation: "create",
        }),
        expect.objectContaining({
          type: "command.executed",
          entity: "user",
          operation: "update",
        }),
        expect.objectContaining({
          type: "command.executed",
          entity: "user",
          operation: "delete",
        }),
      ]),
    );

    await app.close();
  });

  it("does not publish events when cqrs is disabled", async () => {
    const events: CqrsEvent[] = [];
    const eventBus = createInMemoryCqrsEventBus();
    eventBus.subscribe((event) => {
      events.push(event);
    });

    const entity = defineEntity({
      name: "user",
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      findAll: async () => [{ id: "1", name: "John" }],
    });

    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      cqrs: {
        enabled: false,
        eventBus,
      },
    });

    await app.inject({ method: "GET", url: "/user" });
    expect(events).toHaveLength(0);

    await app.close();
  });
});
