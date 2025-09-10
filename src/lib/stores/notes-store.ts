import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { NotesStore, Note } from "./notes-store.types";
import { SaveStatus } from "../types/save-status.types";

// Enable Map and Set support in immer
enableMapSet();

export const useNotesStore = create<NotesStore>()(
  immer((set, get) => ({
    // === STATE ===
    notes: new Map<number, Note>(),
    selectedNoteId: null,
    editingContent: new Map<number, string>(),
    notesStatus: new Map<number, SaveStatus>(),

    // === ACTIONS ===
    setNote: (note) =>
      set((state) => {
        state.notes.set(note.id, note);
      }),
    setNoteStatus: (id, status) => {
      set((state) => {
        state.notesStatus.set(id, status);
      });
    },
    setNotes: (notes) =>
      set((state) => {
        state.notes.clear();
        notes.forEach((note) => state.notes.set(note.id, note));
      }),
    updateContent: (id, content) =>
      set((state) => {
        state.editingContent.set(id, content);
      }),
    selectNote: (id) =>
      set((state) => {
        state.selectedNoteId = id;
      }),
    clearNote: (id) =>
      set((state) => {
        state.notes.delete(id);
        state.editingContent.delete(id);
        // Clear selection if we're clearing the selected note
        if (state.selectedNoteId === id) {
          state.selectedNoteId = null;
        }
      }),
    reset: () =>
      set((state) => {
        state.notes.clear();
        state.editingContent.clear();
        state.selectedNoteId = null;
      }),

    // === SELECTORS ===
    getNote: (id) => {
      return get().notes.get(id);
    },

    getSelectedNote: () => {
      const state = get();
      if (state.selectedNoteId === null) return undefined;
      return state.notes.get(state.selectedNoteId);
    },

    getCurrentContent: (id) => {
      const state = get();
      const editingContent = state.editingContent.get(id);
      if (editingContent !== undefined) return editingContent;

      const note = state.notes.get(id);
      return note?.content || "";
    },
    getNoteStatus: (id) => {
      const state = get();
      const noteStatus = state.notesStatus.get(id);
      if (!noteStatus) {
        return "unknown";
      }
      return noteStatus;
    },
    hasUnsavedChanges: (id) => {
      const state = get();
      const editingContent = state.editingContent.get(id);
      const note = state.notes.get(id);

      if (!editingContent || !note) return false;
      return editingContent !== note.content;
    },

    getAllNotes: () => {
      return Array.from(get().notes.values());
    },
  }))
);
