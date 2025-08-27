import { components } from "../api/notes/types";
import { SaveStatus } from "../services/auto-save-service.types";

export type Note = components["schemas"]["Note"];

// Note Store interface
export interface NotesStore {
  // === STATE ===
  notes: Map<number, Note>;
  selectedNoteId: number | null;
  editingContent: Map<number, string>;

  // === ACTIONS ===
  setNote: (note: Note) => void;
  setNotes: (notes: Note[]) => void;
  updateContent: (id: number, content: string) => void;
  selectNote: (id: number) => void;
  clearNote: (id: number) => void;
  reset: () => void;

  // === SELECTORS ===
  getNote: (id: number) => Note | undefined;
  getSelectedNote: () => Note | undefined;
  getCurrentContent: (id: number) => string;
  hasUnsavedChanges: (id: number) => boolean;
  getAllNotes: () => Note[];
}

// UI Store interface (minimal)
export interface UIStore {
  // === STATE ===
  saveStatus: Map<number, SaveStatus>;
  errors: Map<number, string>;

  // === ACTIONS ===
  setSaveStatus: (id: number, status: SaveStatus) => void;
  setError: (id: number, error: string) => void;
  clearError: (id: number) => void;
  reset: () => void;

  // === SELECTORS ===
  getSaveStatus: (id: number) => SaveStatus;
  getError: (id: number) => string | undefined;
}
