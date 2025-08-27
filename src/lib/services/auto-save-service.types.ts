export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveConfig {
  debounceMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export interface AutoSaveCallbacks {
  getCurrentContent: () => string;
  saveToAPI: (content: string) => Promise<any>; // Note type from your API
  onSaveSuccess: (savedNote: any) => void;
  onSaveError: (error: Error) => void;
  onStatusChange: (status: SaveStatus) => void;
}

export const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  debounceMs: 2000,
  retryAttempts: 3,
  retryDelayMs: 1000,
};