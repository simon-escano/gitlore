/** Frontend type definitions matching the API's Zod schemas */

export interface StackItem {
  name: string;
}

export interface TechStack {
  Primary: StackItem[];
  Supporting: StackItem[];
  Infrastructure: StackItem[];
}

export interface ResultMetric {
  icon: string;
  text: string;
}

export interface Results {
  performance: ResultMetric;
  scale: ResultMetric;
  utility: ResultMetric;
}

export interface LinkItem {
  icon: string;
  label: string;
  url: string;
}

export interface Feature {
  icon: string;
  text: string;
}

export interface GitloreOutput {
  title: string;
  one_liner: string;
  contributions: string;
  links: LinkItem[];
  problem: string;
  goal: string;
  gallery: string[];
  key_features: Feature[];
  architecture_diagram_code: string;
  tech_stack: TechStack;
  stack_reason: string;
  results: Results;
}

export interface ProgressEvent {
  phase: "ingestion" | "inference" | "validation";
  message: string;
  detail?: string;
}

export interface GenerateRequest {
  url: string;
  title: string;
  contributions: string;
  context?: string;
  gallery?: string[];
  links?: Array<{ label: string; url: string }>;
}

export type QueueItemStatus = "pending" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  request: GenerateRequest;
  status: QueueItemStatus;
  progress: ProgressEvent[];
  result?: GitloreOutput;
  error?: string;
  errorDetails?: string;
}
