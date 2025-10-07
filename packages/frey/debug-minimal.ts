import { z } from "zod";
import Fastify from "fastify";
import { defineEntity } from "./src/entity.js";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customId: "id",
  findAll: async (params, { auth }) => {
    console.log("findAll called with auth:", auth);
    return [{ id: "1", name: "Test" }];
  },
});

const fastify = Fastify({ logger: true });

// Simple fastify route without auth
fastify.get("/test", async (request, reply) => {
  reply.send({ message: "Hello World" });
});

fastify.listen({ port: 3001 }).then(() => {
  console.log("Server started on port 3001");
});
