import { z } from "zod";

/**
 * Converts Zod schemas to OpenAPI schema objects
 */
export function zodToOpenAPI(schema: z.ZodTypeAny): any {
  if (schema instanceof z.ZodString) {
    const result: any = { type: "string" };
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        switch ((check as any).kind) {
          case "email":
            result.format = "email";
            break;
          case "uuid":
            result.format = "uuid";
            break;
          case "url":
            result.format = "uri";
            break;
          case "min":
            result.minLength = (check as any).value;
            break;
          case "max":
            result.maxLength = (check as any).value;
            break;
        }
      }
    }
    return result;
  }

  if (schema instanceof z.ZodNumber) {
    const result: any = { type: "number" };
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        switch ((check as any).kind) {
          case "min":
            result.minimum = (check as any).value;
            break;
          case "max":
            result.maximum = (check as any).value;
            break;
          case "int":
            result.type = "integer";
            break;
        }
      }
    }
    return result;
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  if (schema instanceof z.ZodDate) {
    return { type: "string", format: "date-time" };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToOpenAPI((schema._def as any).type as z.ZodTypeAny),
    };
  }

  if (schema instanceof z.ZodObject) {
    const properties: any = {};
    const required: string[] = [];

    const shape = (schema._def as any).shape;
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToOpenAPI(value as z.ZodTypeAny);
      if (!(value as z.ZodTypeAny).isOptional()) {
        required.push(key);
      }
    }

    const result: any = {
      type: "object",
      properties,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return result;
  }

  if (schema instanceof z.ZodOptional) {
    return zodToOpenAPI(schema._def.innerType as z.ZodTypeAny);
  }

  if (schema instanceof z.ZodNullable) {
    return {
      ...zodToOpenAPI(schema._def.innerType as z.ZodTypeAny),
      nullable: true,
    };
  }

  if (schema instanceof z.ZodUnion) {
    return {
      oneOf: (schema._def.options as z.ZodTypeAny[]).map((option: z.ZodTypeAny) =>
        zodToOpenAPI(option),
      ),
    };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: (schema._def as any).values,
    };
  }

  if (schema instanceof z.ZodLiteral) {
    return {
      type: typeof (schema._def as any).value,
      enum: [(schema._def as any).value],
    };
  }

  // Fallback for unknown types
  return { type: "string" };
}

/**
 * Generates OpenAPI schema for query parameters
 */
export function generateQuerySchema(entity: any) {
  const properties: any = {
    filters: {
      type: "array",
      items: { type: "string" },
      description: "Fields to filter by",
    },
    order: {
      type: "array",
      items: { type: "string" },
      description: "Fields to order by (prefix with - for descending)",
    },
    search: {
      type: "string",
      description: "Search term",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 1000,
      description: "Number of items to return",
    },
    offset: {
      type: "integer",
      minimum: 0,
      description: "Number of items to skip",
    },
  };

  return {
    type: "object",
    properties,
  };
}

/**
 * Generates OpenAPI schema for path parameters
 */
export function generatePathSchema(entity: any) {
  const idField = entity.customId || "id";
  const idType = entity.schema.shape[idField] || z.string();

  return {
    type: "object",
    properties: {
      [idField]: zodToOpenAPI(idType),
    },
    required: [idField],
  };
}
