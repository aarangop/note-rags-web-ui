import { components } from "../api/notes/types";
import { SaveStatus } from "../types/save-status.types";

export type Note = components["schemas"]["Note"];

// Note Store interface
export interface NotesStore {
  // === STATE ===
  notes: Map<number, Note>;
  selectedNoteId: number | null;
  editingContent: Map<number, string>;
  notesStatus: Map<number, SaveStatus>;

  // === ACTIONS ===
  setNote: (note: Note) => void;
  setNotes: (notes: Note[]) => void;
  setNoteStatus: (id: number, status: SaveStatus) => void;
  updateContent: (id: number, content: string) => void;
  selectNote: (id: number) => void;
  clearNote: (id: number) => void;
  reset: () => void;

  // === SELECTORS ===
  getNote: (id: number) => Note | undefined;
  getNoteStatus: (id: number) => SaveStatus;
  getSelectedNote: () => Note | undefined;
  getCurrentContent: (id: number) => string;
  hasUnsavedChanges: (id: number) => boolean;
  getAllNotes: () => Note[];
}

// UI Store interface (minimal) - simplified for manual save
export interface UIStore {
  // === STATE ===
  errors: Map<number, string>;

  // === ACTIONS ===
  setError: (id: number, error: string) => void;
  clearError: (id: number) => void;
  reset: () => void;

  // === SELECTORS ===
  getError: (id: number) => string | undefined;
}
