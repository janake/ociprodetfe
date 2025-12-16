export interface GenerationRun {
  id: number;
  requestedCount: number;
  createdCount?: number | null;
  generationStartedAt: string;
  generationFinishedAt?: string | null;
  durationMillis?: number | null;
}

