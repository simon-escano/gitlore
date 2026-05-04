import { z } from "zod";

export const GenerateRequestSchema = z.object({
  owner: z.string().min(1).regex(/^[a-zA-Z0-9_.-]+$/, "Invalid GitHub username"),
  repo: z.string().min(1).regex(/^[a-zA-Z0-9_.-]+$/, "Invalid repository name"),
  context: z.string().max(2000).optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
