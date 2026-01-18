// @convex-poc/shared-types/template - Template type definitions
// This file contains TypeScript types and Zod schemas for Template entities

import { z } from "zod";

export const TemplateTypeSchema = z.union([
  z.literal("BE boilerplate"),
  z.literal("FE boilerplate"),
  z.literal("BE CRUD"),
  z.literal("FE CRUD"),
  z.literal("UI CRUD"),
]);

export type TemplateType = z.infer<typeof TemplateTypeSchema>;

export const TemplateSchema = z.object({
  name: z.string(),
  type: TemplateTypeSchema,
  path: z.string(), // .templates/ directory path
  content: z.string(), // Handlebars template
  variables: z.array(z.string()), // Required variable names
});

export type Template = z.infer<typeof TemplateSchema>;
