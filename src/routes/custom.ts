import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";

export const registerCustomRoutes = (
  server: FastifyInstance,
  entity: Entity<z.ZodObject<Record<string, any>>>,
) => {
  if (!entity.customRoutes || entity.customRoutes.length === 0) {
    return;
  }

  entity.customRoutes.forEach((customRoute) => {
    const fullPath = `/${entity.name}${customRoute.path}`;

    server.log.info(
      `Registering custom route: ${customRoute.method} ${fullPath}`,
    );

    // Use type assertion to handle the dynamic method call
    const method = customRoute.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "head"
      | "options";

    (server[method] as any)(fullPath, async (request: any, reply: any) => {
      try {
        await customRoute.registerRoute(request, reply, {
          server,
          entity,
        });
      } catch (error: any) {
        server.log.error(`Error in custom route ${fullPath}:`, error);
        reply.status(500).send({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  });
};
