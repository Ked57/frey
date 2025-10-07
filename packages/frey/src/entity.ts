import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import type { PrettyInfer } from "./helpers/types.ts";

export type OrderField<Schema extends z.ZodObject<any>> =
  | keyof z.infer<Schema>
  | `-${string & keyof z.infer<Schema>}`;

export type QueryParams<Schema extends z.ZodObject<any>> = {
  filters?: (keyof z.infer<Schema>)[];
  order?: OrderField<Schema>[];
  search?: string;
  limit?: number;
  offset?: number;
};

export type Params<Schema extends z.ZodObject<any>> =
  | QueryParams<Schema>
  | Record<string, string | string[] | number | boolean | undefined>;

export type Context = {
  request: FastifyRequest;
  server: FastifyInstance;
  auth: {
    user?: {
      id: string;
      email: string;
      role?: string;
      permissions?: string[];
      metadata?: Record<string, any>;
    };
    isAuthenticated: boolean;
    token?: string;
    apiKey?: string;
    authMethod?: 'jwt' | 'api-key';
  };
};

export type EntityRbacConfig = {
  ownerField?: string; // default: 'id'
  operations?: {
    [roleName: string]: {
      findAll?: 'All' | 'Own' | 'Custom';
      findOne?: 'All' | 'Own' | 'Custom';
      create?: 'All' | 'Own' | 'Custom';
      update?: 'All' | 'Own' | 'Custom';
      delete?: 'All' | 'Own' | 'Custom';
    };
  };
  customChecks?: {
    findAll?: (context: any, entity: any, operation: string) => Promise<boolean>;
    findOne?: (context: any, entity: any, operation: string) => Promise<boolean>;
    create?: (context: any, entity: any, operation: string) => Promise<boolean>;
    update?: (context: any, entity: any, operation: string) => Promise<boolean>;
    delete?: (context: any, entity: any, operation: string) => Promise<boolean>;
  };
};

export type CustomRoute<Schema extends z.ZodObject<any>> = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  auth?: {
    requireAuth?: boolean; // default: true when auth.enabled is true, false to opt-out
    jwtOnly?: boolean;
    apiKeyOnly?: boolean;
    customAuth?: (request: any) => Promise<boolean>;
  };
  customErrors?: {
    [statusCode: number]: {
      error: string;
      message: string;
      details?: any;
    };
  };
  registerRoute: (
    request: FastifyRequest,
    reply: FastifyReply,
    context: { server: FastifyInstance; entity: Entity<Schema> },
  ) => Promise<void> | void;
};

export type Entity<Schema extends z.ZodObject<any>> = {
  name: string;
  schema: Schema;
  customId?: string;
  customRoutes?: CustomRoute<Schema>[];
  auth?: {
    requireAuth?: boolean; // default: true when auth.enabled is true, false to opt-out
    jwtOnly?: boolean;
    apiKeyOnly?: boolean;
    customAuth?: (request: any) => Promise<boolean>;
  };
  customErrors?: {
    [statusCode: number]: {
      error: string;
      message: string;
      details?: any;
    };
  };
  rbac?: EntityRbacConfig;
  findAll: (
    params: Params<Schema>,
    context: Context,
  ) => Promise<PrettyInfer<z.ZodArray<Schema>>>;
  findOne?: (param: string, context: Context) => Promise<PrettyInfer<Schema>>;
  delete?: (params: Params<Schema>, context: Context) => Promise<void>;
  create?: (
    params: Params<Schema>,
    context: Context,
  ) => Promise<PrettyInfer<Schema>>;
  update?: (
    params: Params<Schema>,
    context: Context,
  ) => Promise<PrettyInfer<Schema>>;
};

export const defineEntity = <Schema extends z.ZodObject<any>>(
  entity: Entity<Schema>,
): Entity<Schema> => ({
  ...entity,
  schema: entity.schema,
});
