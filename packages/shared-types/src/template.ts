// @convex-poc/shared-types/template - Template type definitions
// This file contains TypeScript types and Zod schemas for Template entities

import { z } from "zod";

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  template: z.string(),
  variables: z.array(z.string()),
});

export type Template = z.infer<typeof TemplateSchema>;
