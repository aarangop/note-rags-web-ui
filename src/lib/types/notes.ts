// Note types based on the Svelte app API
export interface Note {
  id: number;
  title: string;
  content: string;
  file_path: string;
  document_type: 'note' | 'pdf';
  created_at?: string;
  updated_at?: string;
  metadata: Record<string, unknown>;
}

export interface NoteCreate {
  title: string;
  content: string;
  file_path: string;
  document_type?: 'note' | 'pdf';
  metadata?: Record<string, unknown>;
}

export interface NoteUpdate {
  title?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotesPage {
  items: Note[] | null;
  page: number;
  size: number;
  total: number;
  pages: number;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';