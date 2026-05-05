/** Frontend type definitions matching the API's Zod schemas */

export interface StackItem {
  name: string;
  role: string;
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
  gallery: string[];
  problem: string;
  goal: string;
  key_features: Feature[];
  architecture_diagram_code: string;
  tech_stack: StackItem[];
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
}

export type QueueItemStatus = "pending" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  request: GenerateRequest;
  status: QueueItemStatus;
  progress: ProgressEvent[];
  result?: GitloreOutput;
  error?: string;
}
