import { z } from "zod";

const StackItemSchema = z.object({
  name: z.string(),
  role: z.enum(["Primary", "Supporting", "Infrastructure"]),
});

const ResultsSchema = z.object({
  performance: z.object({ icon: z.string(), text: z.string() }),
  scale: z.object({ icon: z.string(), text: z.string() }),
  utility: z.object({ icon: z.string(), text: z.string() }),
});

const LinkSchema = z.object({
  icon: z.string(),
  label: z.string(),
  url: z.string(), // Relaxed from .url() as LLMs sometimes omit https://
});

const FeatureSchema = z.object({
  icon: z.string(),
  text: z.string(),
});

export const GitloreOutputSchema = z.object({
  title: z.string(),
  one_liner: z.string(),
  contributions: z.string(),
  problem: z.string(),
  goal: z.string(),
  results: ResultsSchema,
  stack: z.array(StackItemSchema).min(1),
  stack_reason: z.string(),
  architecture_diagram_code: z.string(),
  gallery: z.array(z.string()).default([]), // Relaxed from .url()
  links: z.array(LinkSchema).min(1),
  key_features: z.array(FeatureSchema).min(1).max(5),
});

export type GitloreOutput = z.infer<typeof GitloreOutputSchema>;
