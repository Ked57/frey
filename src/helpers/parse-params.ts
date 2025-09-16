import { z } from "zod";
import { Entity } from "../entity.js";

export const parseParams = <
  E extends Entity<Schema>,
  Schema extends z.ZodObject<any>,
>({
  params,
  entity,
  isIdSpecific,
}: {
  params: unknown;
  entity: E;
  isIdSpecific?: boolean;
}) => {
  const schema = z.record(z.string(), z.unknown()).transform((input) => {
    const result: Record<
      string,
      string | string[] | number | boolean | undefined
    > = {};

    if (isIdSpecific) {
      const idField = entity.customId ?? "id";
      if (!(idField in input)) {
        throw new Error(`Required parameter '${idField}' is missing`);
      }
    }

    for (const [key, value] of Object.entries(input)) {
      // Security: Validate parameter key
      if (key.length > 100) {
        throw new Error(
          `Parameter key '${key}' is too long (max 100 characters)`,
        );
      }

      // Security: Validate parameter key pattern (alphanumeric + underscore/dash only)
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
        throw new Error(`Parameter key '${key}' contains invalid characters`);
      }

      if (typeof value === "string") {
        // Security: Validate string length
        if (value.length > 10000) {
          throw new Error(
            `Parameter '${key}' value is too long (max 10000 characters)`,
          );
        }

        // Security: Basic XSS prevention - remove potentially dangerous characters
        const sanitizedValue = value
          .replace(/[<>]/g, "") // Remove < and > to prevent basic HTML injection
          .replace(/javascript:/gi, "") // Remove javascript: protocol
          .replace(/on\w+=/gi, "") // Remove event handlers like onclick=
          .trim();

        // Parse string values to their appropriate types
        if (sanitizedValue === "true") {
          result[key] = true;
        } else if (sanitizedValue === "false") {
          result[key] = false;
        } else if (sanitizedValue === "undefined" || sanitizedValue === "") {
          result[key] = undefined;
        } else if (/^-?\d+$/.test(sanitizedValue)) {
          // Only digits (including negative numbers)
          const num = parseInt(sanitizedValue, 10);
          // Security: Validate number range
          if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
            throw new Error(`Parameter '${key}' number is out of safe range`);
          }
          result[key] = num;
        } else if (/^-?\d*\.\d+$/.test(sanitizedValue)) {
          // Decimal numbers
          const num = parseFloat(sanitizedValue);
          // Security: Validate number range
          if (!isFinite(num)) {
            throw new Error(`Parameter '${key}' number is not finite`);
          }
          result[key] = num;
        } else {
          // Keep as string (sanitized)
          result[key] = sanitizedValue;
        }
      } else if (typeof value === "number") {
        // Security: Validate number range
        if (!isFinite(value)) {
          throw new Error(`Parameter '${key}' number is not finite`);
        }
        result[key] = value;
      } else if (typeof value === "boolean") {
        result[key] = value;
      } else if (Array.isArray(value)) {
        // Security: Validate array length
        if (value.length > 100) {
          throw new Error(
            `Parameter '${key}' array is too long (max 100 items)`,
          );
        }
        result[key] = value.map(String);
      } else if (value === undefined) {
        result[key] = value;
      } else {
        throw new Error(
          `Parameter '${key}' must be a string, number, boolean, array, or undefined`,
        );
      }
    }
    return result;
  });

  return schema.parse(params);
};
