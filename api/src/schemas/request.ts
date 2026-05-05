import { z } from "zod";

export const GenerateRequestSchema = z.object({
  url: z.string().url("Must be a valid GitHub URL"),
  title: z.string().min(1),
  contributions: z.string().min(1),
  context: z.string().optional(),
  gallery: z.array(z.string()).optional().default([]),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
