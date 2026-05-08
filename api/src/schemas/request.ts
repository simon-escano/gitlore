import { z } from "zod";

export const LinkInputSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
});

export const GenerateRequestSchema = z.object({
  url: z.string().url("Must be a valid GitHub URL"),
  title: z.string().min(1),
  contributions: z.string().min(1),
  context: z.string().optional(),
  gallery: z.array(z.string()).optional().default([]),
  links: z.array(LinkInputSchema).optional().default([]),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
