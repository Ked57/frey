import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { z } from "zod";
import WebSocket from "ws";
import { defineEntity } from "../../src/entity.js";
import { buildTestApp } from "../test-utils/buildTestApp.js";
import type { FastifyReply, FastifyRequest } from "fastify";

describe("stream surfaces integration", () => {
  const jwtSecret = "stream-test-secret";

  const signedToken = jwt.sign(
    { sub: "user-1", email: "user@example.com", role: "user" },
    jwtSecret,
  );

  it("enforces auth consistently on SSE custom routes", async () => {
    const entity = defineEntity({
      name: "stream",
      schema: z.object({ id: z.string() }),
      findAll: async () => [],
      customRoutes: [
        {
          path: "/events",
          method: "GET",
          auth: { requireAuth: true },
          registerRoute: async (_request, reply) => {
            reply.header("content-type", "text/event-stream");
            reply.send("data: hello\n\n");
          },
        },
      ],
    });

    const { app } = await buildTestApp({
      entities: [entity] as const,
      auth: {
        enabled: true,
        jwt: { secret: jwtSecret },
      },
      websocket: { enabled: true },
      swagger: { enabled: false },
    });

    const unauthorized = await app.inject({
      method: "GET",
      url: "/stream/events",
    });
    expect(unauthorized.statusCode).toBe(401);

    const authorized = await app.inject({
      method: "GET",
      url: "/stream/events",
      headers: {
        authorization: `Bearer ${signedToken}`,
      },
    });

    expect(authorized.statusCode).toBe(200);
    expect(authorized.headers["content-type"]).toContain("text/event-stream");
    await app.close();
  });

  it.skip("supports websocket custom routes", async () => {
    const entity = defineEntity({
      name: "stream",
      schema: z.object({ id: z.string() }),
      findAll: async () => [],
      customRoutes: [
        {
          path: "/socket",
          method: "GET",
          auth: { requireAuth: false },
          websocket: true,
          registerWebSocketRoute: (socket: WebSocket) => {
            socket.on("message", (data: WebSocket.RawData) => {
              if (data.toString() === "ping") {
                socket.send("welcome");
              }
            });
          },
          registerRoute: (_request: FastifyRequest, _reply: FastifyReply) => {
            // HTTP handler is unused for websocket routes.
          },
        },
      ],
    });

    const { app } = await buildTestApp({
      entities: [entity] as const,
      swagger: { enabled: false },
      websocket: { enabled: true },
    });
    const ws = await (app as any).injectWS("/stream/socket");
    const message = await new Promise<string>((resolve, reject) => {
      ws.on("open", () => {
        ws.send("ping");
      });
      ws.on("message", (data: WebSocket.RawData) => {
        resolve(data.toString());
        ws.close();
      });
      ws.on("error", (error: Error) => {
        reject(new Error(`WebSocket error: ${error.message}`));
      });
    });

    expect(message).toBe("welcome");
    await app.close();
  });
});
