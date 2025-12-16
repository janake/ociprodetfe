export interface GeneratedFile {
  id: number;
  generationId?: number | null;
  storagePath: string;
  fileName: string;
  creationStartedAt: string;
  creationFinishedAt: string;
  fileSizeBytes: number;
}
