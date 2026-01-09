
export type AIAction = 'TRANSCRIBE' | 'FORMAT' | 'REPORT' | 'SUMMARY' | 'SUPPLEMENT';

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface FileResult {
  action: AIAction;
  content: string;
}

export interface BatchFile {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  status: ProcessingStatus;
  results: Partial<Record<AIAction, string>>;
}
