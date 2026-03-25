import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import type { AuthConfig } from "../auth/types.js";
import { parseParams } from "../helpers/parse-params.js";
import { zodToOpenAPI, generateQuerySchema } from "../helpers/zod-to-openapi.js";
import { getReadErrorResponses } from "../helpers/error-schemas.js";
import { getAuthErrorResponses } from "../helpers/auth-error-schemas.js";
import { createRouteAuthMiddleware } from "../auth/middleware.js";
import { createRbacMiddleware } from "../auth/rbac.js";
import type { CqrsEvent } from "../cqrs/types.js";
import { publishCqrsEvent } from "../cqrs/state.js";

export const registerFindAllRoute = (
  server: FastifyInstance,
  entity: Entity<any>,
  globalAuth?: AuthConfig,
) => {
  // Prepare preHandlers for authentication
  const preHandlers = [];
  
  // Add authentication middleware if entity requires auth
  // Auto-enable auth if any auth method is configured
  const authEnabled = globalAuth?.enabled ?? (globalAuth?.jwt || globalAuth?.apiKey);
  const authConfig = entity.auth || {};
  const requiresAuth = authEnabled && authConfig.requireAuth !== false;
  
  if (requiresAuth) {
    preHandlers.push(createRouteAuthMiddleware(authConfig, globalAuth));
    
    // Add RBAC middleware if RBAC is enabled
    const rbacEnabled = globalAuth?.rbac?.enabled ?? !!globalAuth?.rbac;
    if (rbacEnabled) {
      preHandlers.push(createRbacMiddleware(
        entity.name,
        'read',
        entity.rbac,
        globalAuth?.rbac?.customRoles
      ));
    }
  }

  // Prepare response schema with auth errors if needed
  const responseSchema = {
    200: {
      type: "array",
      items: zodToOpenAPI(entity.schema),
      description: `List of ${entity.name}s`,
    },
    ...getReadErrorResponses(),
  };

  // Add auth error responses if entity requires auth
  if (requiresAuth) {
    Object.assign(responseSchema, getAuthErrorResponses());
  }

  // Merge custom error responses if provided
  if (entity.customErrors) {
    Object.assign(responseSchema, entity.customErrors);
  }

  const routeOptions: any = {
    schema: {
      summary: `Get all ${entity.name}s`,
      description: `Retrieve a list of ${entity.name}s with optional filtering, sorting, and pagination`,
      tags: [entity.name],
      querystring: generateQuerySchema(entity),
      response: responseSchema,
    },
  };

  if (preHandlers.length > 0) {
    routeOptions.preHandler = preHandlers;
  }

  server.get(`/${entity.name}`, routeOptions, async (request, reply) => {
    try {
      const params = parseParams({
        params: request.query,
        entity,
        isIdSpecific: false,
      });

      const result = await entity.findAll(params, {
        request,
        server,
        auth: (request as any).auth,
      });

      // v3 CQRS slice: emit query event when enabled (list/reads).
      await publishCqrsEvent({
        type: "query.executed",
        entity: entity.name,
        operation: "findAll",
        payload: params,
      } satisfies CqrsEvent);

      // v3 HATEOAS / pagination links (RFC 5988) for `limit`/`offset`.
      // Rules (TDD-driven by tests):
      // - Emit Link header only when both limit and offset are provided.
      // - Include `rel="prev"` only when offset > 0.
      // - Include `rel="next"` only when result.length === limit (best-effort).
      // - If neither link exists, omit the header entirely.
      const limit =
        typeof (params as any).limit === "number"
          ? (params as any).limit
          : undefined;
      const offset =
        typeof (params as any).offset === "number"
          ? (params as any).offset
          : undefined;

      if (limit !== undefined && offset !== undefined && Array.isArray(result)) {
        const protocol = (request as any).protocol ?? "http";
        const host =
          (request as any).hostname ??
          (request as any).headers?.host ??
          "localhost";

        // request.url is relative (e.g. "/user?name=John&limit=2&offset=0")
        const url = new URL(request.url ?? `/${entity.name}`, `${protocol}://${host}`);

        const makeHref = (newOffset: number) => {
          const cloned = new URL(url.toString());
          cloned.searchParams.set("offset", String(newOffset));
          return cloned.toString();
        };

        const linkParts: string[] = [];

        if (offset > 0) {
          const prevOffset = Math.max(offset - limit, 0);
          linkParts.push(
            `<${makeHref(prevOffset)}>; rel="prev"`,
          );
        }

        if (result.length === limit) {
          const nextOffset = offset + limit;
          linkParts.push(
            `<${makeHref(nextOffset)}>; rel="next"`,
          );
        }

        if (linkParts.length > 0) {
          reply.header("Link", linkParts.join(", "));
        }
      }

      reply.send(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("parameter")) {
        // Some unit tests call the handler directly with a minimal `reply` mock.
        // Guard against missing Fastify methods so we don't throw inside error handling.
        if (typeof (reply as any).status === "function") {
          reply.status(400).send({
            error: "Invalid query parameters",
            message: error.message,
          });
        } else {
          (reply as any).send?.({
            error: "Invalid query parameters",
            message: error.message,
          });
        }
        return;
      }

      if (error instanceof z.ZodError) {
        if (typeof (reply as any).status === "function") {
          reply.status(400).send({
            error: "Invalid query parameters",
            details: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          });
        } else {
          (reply as any).send?.({
            error: "Invalid query parameters",
            details: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          });
        }
        return;
      }

      server.log.error(error);
      if (typeof (reply as any).status === "function") {
        reply.status(500).send({
          error: "Internal server error",
        });
      } else {
        (reply as any).send?.({
          error: "Internal server error",
        });
      }
    }
  });
};
