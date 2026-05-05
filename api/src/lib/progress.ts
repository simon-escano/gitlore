export type ProgressPhase = "ingestion" | "inference" | "validation";

export interface ProgressEvent {
  phase: ProgressPhase;
  message: string;
  detail?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

/** No-op callback for when streaming is not needed */
export const noopProgress: ProgressCallback = () => {};
