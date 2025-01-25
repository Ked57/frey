import { z } from "zod";

// Matt Pocock's Prettify utility type
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type PrettyInfer<T extends z.ZodType<any, any, any>> = Prettify<
  z.infer<T>
>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
);

export type JsonSchema = z.infer<typeof jsonSchema>;
