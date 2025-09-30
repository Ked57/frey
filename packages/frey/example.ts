import { z } from "zod";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { defineEntity } from "./src/entity.js";
import { startServer } from "./src/main.js";

const userSchema = z.object({
  uuid: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customId: "uuid",
  customRoutes: [
    {
      path: "/mycustomroute",
      method: "GET",
      registerRoute: async (
        request: FastifyRequest,
        reply: FastifyReply,
        { server, entity }: any,
      ) => {
        // entity.schema is now properly typed as userSchema
        reply.send({
          message: "Hello from custom route!",
          entityName: entity.name,
          timestamp: new Date().toISOString(),
        });
      },
    },
    {
      path: "/stats",
      method: "GET",
      registerRoute: async (
        request: FastifyRequest,
        reply: FastifyReply,
        { server, entity }: any,
      ) => {
        reply.send({
          totalUsers: 42,
          activeUsers: 38,
          entityName: entity.name,
        });
      },
    },
  ],
  findAll: async (params: any, { request, server }: any) => {
    return [
      {
        uuid: crypto.randomUUID(),
        name: "John Doe",
        email: "john.doe@example.com",
        createdAt: new Date(),
      },
    ];
  },
  findOne: async (param: any, { request, server }: any) => {
    return {
      uuid: crypto.randomUUID(),
      name: "John Doe",
      email: "john.doe@example.com",
      createdAt: new Date(),
    };
  },
  // delete: (params: any, context: any) => {},
  // create: (params: any, context: any) => {},
  // update: (params: any, context: any) => {},
});

const fastify = Fastify({
  logger: true,
});

startServer(fastify, {
  entities: [userEntity],
  port: 3000,
  swagger: {
    enabled: true,
    title: "User Management API",
    description: "API for managing users with Frey framework",
    version: "1.0.0",
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  },
  // middlewares: [],
});
