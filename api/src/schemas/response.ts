import { z } from "zod";

const StackItemSchema = z.preprocess((val) => {
  if (typeof val === "string") return { name: val };
  return val;
}, z.object({
  name: z.string(),
}));

const ResultsSchema = z.object({
  performance: z.object({ icon: z.string().default("zap"), text: z.string().default("") }),
  scale: z.object({ icon: z.string().default("layers"), text: z.string().default("") }),
  utility: z.object({ icon: z.string().default("shield"), text: z.string().default("") }),
});

const LinkSchema = z.preprocess((val) => {
  if (typeof val === "string") return { icon: "link", label: val, url: val };
  return val;
}, z.object({
  icon: z.string().default("link"),
  label: z.string().default("Link"),
  url: z.string().default("#"),
}));

const FeatureSchema = z.preprocess((val) => {
  if (typeof val === "string") return { icon: "zap", text: val };
  return val;
}, z.object({
  icon: z.string().default("zap"),
  text: z.string().default(""),
}));

export const GitloreOutputSchema = z.object({
  title: z.string().default("Project"),
  one_liner: z.string().default(""),
  contributions: z.string().default(""),
  links: z.array(LinkSchema).default([]),
  problem: z.string().default(""),
  goal: z.string().default(""),
  gallery: z.array(z.string()).default([]),
  key_features: z.array(FeatureSchema).default([]),
  architecture_diagram_code: z.string().default(""),
  tech_stack: z.object({
    Primary: z.array(StackItemSchema).default([]),
    Supporting: z.array(StackItemSchema).default([]),
    Infrastructure: z.array(StackItemSchema).default([]),
  }).default({ Primary: [], Supporting: [], Infrastructure: [] }),
  stack_reason: z.string().default(""),
  results: ResultsSchema.optional().default({
    performance: { icon: "zap", text: "" },
    scale: { icon: "layers", text: "" },
    utility: { icon: "shield", text: "" }
  }),
});

export type GitloreOutput = z.infer<typeof GitloreOutputSchema>;
